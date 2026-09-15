from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user, get_accessible_mine_ids
from app.services.task_scheduler_service import TaskSchedulerService
from app.schemas.daily_task import DailyTaskResponse, DailyTaskGenerateResponse
from app.models.daily_task import DailyTask
from app.models.user import User
from app.models.enums import TaskStatus
from app.models.governance_point_transaction import GovernancePointTransaction

router = APIRouter()

class TaskStatusUpdate(BaseModel):
    status: str # PENDING, COMPLETED, DISMISSED

@router.post("/generate-daily", response_model=DailyTaskGenerateResponse)
def trigger_daily_tasks(db: Session = Depends(get_db)):
    """
    Manually triggers the daily task generation.
    """
    count = TaskSchedulerService.generate_daily_tasks(db)
    return DailyTaskGenerateResponse(
        message="Daily task generation completed.",
        tasks_generated=count
    )

@router.get("", response_model=List[DailyTaskResponse])
def get_daily_tasks(
    mine_id: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve generated daily tasks.
    """
    mine_ids = get_accessible_mine_ids(current_user, db)
    query = db.query(DailyTask).filter(DailyTask.mine_id.in_(mine_ids))
    
    if mine_id:
        if mine_id in mine_ids:
            query = query.filter(DailyTask.mine_id == mine_id)
        else:
            query = query.filter(DailyTask.mine_id == "NONE")
    if role:
        query = query.filter(DailyTask.role == role)
    
    return query.order_by(DailyTask.created_at.desc()).all()

@router.put("/{task_id}/status", response_model=DailyTaskResponse)
def update_daily_task_status(
    task_id: str,
    payload: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status of a daily task (COMPLETED / DISMISSED / PENDING)"""
    task = db.query(DailyTask).filter(DailyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        new_status = TaskStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid task status: {payload.status}")

    task.status = new_status
    
    # If completed, award +10 daily reporting governance points
    if new_status == TaskStatus.COMPLETED:
        tx = GovernancePointTransaction(
            user_id=current_user.id,
            mine_id=task.mine_id,
            points=10,
            category="DAILY_TASK_COMPLETED",
            reason=f"Completed daily task: {task.title}"
        )
        db.add(tx)

    db.commit()
    db.refresh(task)
    return task
