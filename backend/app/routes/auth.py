import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest,
    ResetPasswordRequest, TokenResponse, SendOTPRequest, VerifyOTPRequest
)
from app.auth.password import get_password_hash, verify_password
from app.auth.jwt_handler import create_access_token, create_reset_token, verify_token
from app.services.email import send_login_otp_email, send_login_alert_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    hashed_pwd = get_password_hash(req.password)
    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        password_hash=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Dispatch security alert over SMTP in background
    login_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    bg_tasks.add_task(send_login_alert_email, user.email, user.name, login_time)

    access_token = create_access_token(data={"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/send-otp")
def send_otp(req: SendOTPRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    
    # Auto-provision user account if registering/logging in via OTP for the first time
    if not user:
        default_name = clean_email.split("@")[0].replace(".", " ").title()
        user = User(
            name=default_name,
            email=clean_email,
            password_hash=get_password_hash(f"otp_user_{random.randint(10000, 99999)}")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Send OTP over SMTP in background task
    bg_tasks.add_task(send_login_otp_email, user.email, user.name, otp)

    return {
        "message": f"Verification code sent to {user.email}",
        "demo_otp": otp  # Included for ease of local testing
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: VerifyOTPRequest, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not user.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP was requested for this account or OTP is invalid."
        )
    
    if user.otp_code != req.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP verification code."
        )
    
    if not user.otp_expires_at or datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification code has expired. Please request a new one."
        )
    
    # Clear OTP after successful verification
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()

    # Send security notification in background
    login_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    bg_tasks.add_task(send_login_alert_email, user.email, user.name, login_time)

    access_token = create_access_token(data={"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        # Prevent user enumeration, return clean success message
        return {"message": "If this email is registered, a password reset link has been prepared."}

    reset_token = create_reset_token(email=user.email)
    user.reset_token = reset_token
    db.commit()

    return {
        "message": "Password reset token generated successfully.",
        "reset_token": reset_token # Returned so frontend demo reset link works seamlessly
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    payload = verify_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email, User.reset_token == req.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token or token already used"
        )
    
    user.password_hash = get_password_hash(req.new_password)
    user.reset_token = None
    db.commit()

    return {"message": "Password has been successfully updated. You can now login."}

