from app.api.deps import get_db, get_current_user, get_accessible_mine_ids, require_mine_access
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.user import User
from app.models.environment_reading import EnvironmentReading
from app.models.mine import Mine
from app.schemas.environment_reading import EnvironmentReadingCreate, EnvironmentReadingUpdate, EnvironmentReadingResponse

router = APIRouter()

@router.post("/readings", response_model=EnvironmentReadingResponse, status_code=201)
def create_reading(reading_in: EnvironmentReadingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_mine_access(reading_in.mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == reading_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
        
    db_obj = EnvironmentReading(**reading_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/readings", response_model=List[EnvironmentReadingResponse])
def read_readings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(EnvironmentReading).filter(EnvironmentReading.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/readings/{reading_id}", response_model=EnvironmentReadingResponse)
def read_reading(reading_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(EnvironmentReading).filter(EnvironmentReading.id == reading_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="EnvironmentReading not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.delete("/readings/{reading_id}")
def delete_reading(reading_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(EnvironmentReading).filter(EnvironmentReading.id == reading_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="EnvironmentReading not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
