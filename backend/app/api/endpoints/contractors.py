from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.contractor import Contractor
from app.models.mine import Mine
from app.schemas.contractor import ContractorCreate, ContractorUpdate, ContractorResponse
from app.api.deps import get_current_user, get_accessible_mine_ids, require_mine_access
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ContractorResponse, status_code=201)
def create_contractor(contractor_in: ContractorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_mine_access(contractor_in.mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == contractor_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
        
    db_obj = Contractor(**contractor_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[ContractorResponse])
def read_contractors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(Contractor).filter(Contractor.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/{contractor_id}", response_model=ContractorResponse)
def read_contractor(contractor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contractor not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.put("/{contractor_id}", response_model=ContractorResponse)
def update_contractor(contractor_id: str, contractor_in: ContractorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contractor not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    update_data = contractor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{contractor_id}")
def delete_contractor(contractor_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contractor not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
