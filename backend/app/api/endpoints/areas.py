from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.area import Area
from app.models.region import Region
from app.schemas.area import AreaCreate, AreaUpdate, AreaResponse

router = APIRouter()

@router.get("/", response_model=List[AreaResponse])
def read_areas(db: Session = Depends(deps.get_db)):
    return db.query(Area).all()

@router.post("/", response_model=AreaResponse, status_code=status.HTTP_201_CREATED)
def create_area(area_in: AreaCreate, db: Session = Depends(deps.get_db)):
    if not db.query(Region).filter(Region.id == area_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
        
    db_area = db.query(Area).filter(Area.code == area_in.code).first()
    if db_area:
        raise HTTPException(status_code=400, detail="Area with this code already exists")
        
    db_area = Area(**area_in.model_dump())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@router.get("/{id}", response_model=AreaResponse)
def read_area(id: str, db: Session = Depends(deps.get_db)):
    db_area = db.query(Area).filter(Area.id == id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    return db_area

@router.put("/{id}", response_model=AreaResponse)
def update_area(id: str, area_in: AreaUpdate, db: Session = Depends(deps.get_db)):
    db_area = db.query(Area).filter(Area.id == id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
        
    if area_in.region_id and not db.query(Region).filter(Region.id == area_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
    
    if area_in.code:
        existing = db.query(Area).filter(Area.code == area_in.code, Area.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Area with this code already exists")

    update_data = area_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_area, key, value)
    
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(id: str, db: Session = Depends(deps.get_db)):
    db_area = db.query(Area).filter(Area.id == id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    db.delete(db_area)
    db.commit()
    return None
