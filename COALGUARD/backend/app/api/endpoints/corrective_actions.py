from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.corrective_action import CorrectiveAction
from app.models.mine import Mine
from app.models.user import User
from app.schemas.corrective_action import CorrectiveActionCreate, CorrectiveActionUpdate, CorrectiveActionResponse
from app.api.deps import get_current_user, get_accessible_mine_ids, require_mine_access

router = APIRouter()

@router.post("/", response_model=CorrectiveActionResponse, status_code=201)
def create_action(action_in: CorrectiveActionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine = db.query(Mine).filter(Mine.id == action_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
    require_mine_access(action_in.mine_id, current_user, db)
    user = db.query(User).filter(User.id == action_in.assigned_to).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid assigned_to user_id")
        
    db_obj = CorrectiveAction(**action_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[CorrectiveActionResponse])
def read_actions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(CorrectiveAction).filter(CorrectiveAction.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/{action_id}", response_model=CorrectiveActionResponse)
def read_action(action_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Action not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.put("/{action_id}", response_model=CorrectiveActionResponse)
def update_action(action_id: str, action_in: CorrectiveActionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Action not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    update_data = action_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{action_id}")
def delete_action(action_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Action not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
