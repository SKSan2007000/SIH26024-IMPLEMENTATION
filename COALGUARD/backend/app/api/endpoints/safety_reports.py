from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.safety_report import SafetyReport
from app.models.mine import Mine
from app.models.user import User
from app.schemas.safety_report import SafetyReportCreate, SafetyReportUpdate, SafetyReportResponse
from app.api.deps import get_current_user, get_accessible_mine_ids, require_mine_access

router = APIRouter()

@router.post("/", response_model=SafetyReportResponse, status_code=201)
def create_safety_report(report_in: SafetyReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_mine_access(report_in.mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == report_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
    user = db.query(User).filter(User.id == report_in.reported_by).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reported_by user_id")
        
    db_obj = SafetyReport(**report_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[SafetyReportResponse])
def read_safety_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(SafetyReport).filter(SafetyReport.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/{report_id}", response_model=SafetyReportResponse)
def read_safety_report(report_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SafetyReport not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.put("/{report_id}", response_model=SafetyReportResponse)
def update_safety_report(report_id: str, report_in: SafetyReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SafetyReport not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    update_data = report_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{report_id}")
def delete_safety_report(report_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="SafetyReport not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
