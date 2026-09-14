import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from app.config import settings

logger = logging.getLogger("fintrack.email")

def send_smtp_email(to_email: str, subject: str, body_text: str, body_html: str) -> bool:
    """
    Sends an email over SMTP if credentials are configured in app settings.
    If SMTP credentials are not configured, prints the email details to server logs as a safe fallback.
    """
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@fintrack.app"

    # Fallback log mode if SMTP user/password is not configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"[SMTP DEV FALLBACK] To: {to_email} | Subject: '{subject}'\n"
            f"--- TEXT CONTENT ---\n{body_text}\n--------------------"
        )
        try:
            print(f"\n======== [SMTP DEV EMAIL TO: {to_email}] ========")
            print(f"Subject: {subject}")
            print(f"Content:\n{body_text}")
            print("===================================================\n")
        except Exception:
            pass
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"FinTrack App <{from_email}>"
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")

        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        if settings.SMTP_TLS:
            server.starttls()
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Successfully sent SMTP email to {to_email} with subject '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
        # Print fallback so login flow never crashes for end user
        print(f"\n[SMTP ERROR - FALLBACK LOG] To: {to_email} | Subject: {subject} | Error: {e}")
        print(f"Body: {body_text}\n")
        return False

def send_login_otp_email(to_email: str, user_name: str, otp_code: str) -> bool:
    """
    Dispatches a 6-digit OTP login verification code over SMTP.
    """
    subject = f"🔐 Your FinTrack Login Code: {otp_code}"
    
    body_text = (
        f"Hello {user_name},\n\n"
        f"Your one-time login verification code for FinTrack is: {otp_code}\n\n"
        f"This code will expire in 10 minutes. If you did not request this login code, please secure your account immediately.\n\n"
        f"Best regards,\nThe FinTrack Team"
    )

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }}
            .logo {{ display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 10px 16px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 24px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
            .otp-box {{ background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #047857; margin: 24px 0; }}
            .footer {{ margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">FinTrack</div>
            <div class="title">Your Login Verification Code</div>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Use the following 6-digit one-time passcode to complete your login to FinTrack:</p>
            
            <div class="otp-box">{otp_code}</div>

            <p style="font-size: 13px; color: #64748b;">
                ⏰ Code expires in <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>

            <div class="footer">
                FinTrack Personal Expense & Financial Management System
            </div>
        </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, body_text, body_html)

def send_login_alert_email(to_email: str, user_name: str, login_time_str: str) -> bool:
    """
    Dispatches a login security alert over SMTP.
    """
    subject = "🛡️ New Login Detected on Your FinTrack Account"

    body_text = (
        f"Hello {user_name},\n\n"
        f"A new sign-in was detected on your FinTrack account on {login_time_str}.\n\n"
        f"If this was you, no action is needed. If you did not log in, please reset your password immediately.\n\n"
        f"Best regards,\nThe FinTrack Team"
    )

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; }}
            .badge {{ display: inline-block; background: #ecfdf5; color: #047857; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }}
            .footer {{ margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">Security Alert</div>
            <h2>Successful Sign-In Notice</h2>
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>Your FinTrack account was accessed on <strong>{login_time_str}</strong>.</p>
            <p style="font-size: 13px; color: #64748b;">If this was you, you can safely ignore this email.</p>
            <div class="footer">
                FinTrack Security Center
            </div>
        </div>
    </body>
    </html>
    """
    return send_smtp_email(to_email, subject, body_text, body_html)
