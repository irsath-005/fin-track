from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.goal import FinancialGoal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/goals", tags=["Financial Goals"])

def format_goal_response(goal: FinancialGoal) -> GoalResponse:
    pct = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    remaining = max(0.0, goal.target_amount - goal.current_amount)
    is_completed = goal.current_amount >= goal.target_amount

    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        description=goal.description,
        progress_percentage=round(pct, 2),
        remaining_amount=round(remaining, 2),
        is_completed=is_completed,
        created_at=goal.created_at
    )

@router.get("", response_model=List[GoalResponse])
def get_all_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.id).order_by(FinancialGoal.target_date.asc()).all()
    return [format_goal_response(g) for g in goals]

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    req: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = FinancialGoal(
        user_id=current_user.id,
        goal_name=req.goal_name.strip(),
        target_amount=req.target_amount,
        current_amount=req.current_amount,
        target_date=req.target_date.strip(),
        description=req.description.strip() if req.description else None
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal_by_id(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found"
        )
    return format_goal_response(goal)

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    req: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found"
        )

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(goal, key, value)

    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)

@router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal with ID {goal_id} not found"
        )

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully", "id": goal_id}
