from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.inspection import Inspection
from app.models.mine import Mine
from app.models.user import User
from app.schemas.inspection import InspectionCreate, InspectionUpdate, InspectionResponse
from app.api.deps import get_current_user, get_accessible_mine_ids, require_mine_access
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=InspectionResponse, status_code=201)
def create_inspection(inspection_in: InspectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_mine_access(inspection_in.mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == inspection_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
    user = db.query(User).filter(User.id == inspection_in.officer_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid officer_id")
        
    db_obj = Inspection(**inspection_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[InspectionResponse])
def read_inspections(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(Inspection).filter(Inspection.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/{inspection_id}", response_model=InspectionResponse)
def read_inspection(inspection_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Inspection not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.put("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(inspection_id: str, inspection_in: InspectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Inspection not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    update_data = inspection_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{inspection_id}")
def delete_inspection(inspection_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Inspection not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
