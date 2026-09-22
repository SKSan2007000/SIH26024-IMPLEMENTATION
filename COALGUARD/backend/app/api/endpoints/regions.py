from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.region import Region
from app.schemas.region import RegionCreate, RegionUpdate, RegionResponse

router = APIRouter()

@router.get("/", response_model=List[RegionResponse])
def read_regions(db: Session = Depends(deps.get_db)):
    return db.query(Region).all()

@router.post("/", response_model=RegionResponse, status_code=status.HTTP_201_CREATED)
def create_region(region_in: RegionCreate, db: Session = Depends(deps.get_db)):
    db_region = db.query(Region).filter(Region.code == region_in.code).first()
    if db_region:
        raise HTTPException(status_code=400, detail="Region with this code already exists")
    db_region = Region(**region_in.model_dump())
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region

@router.get("/{id}", response_model=RegionResponse)
def read_region(id: str, db: Session = Depends(deps.get_db)):
    db_region = db.query(Region).filter(Region.id == id).first()
    if not db_region:
        raise HTTPException(status_code=404, detail="Region not found")
    return db_region

@router.put("/{id}", response_model=RegionResponse)
def update_region(id: str, region_in: RegionUpdate, db: Session = Depends(deps.get_db)):
    db_region = db.query(Region).filter(Region.id == id).first()
    if not db_region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    if region_in.code:
        existing = db.query(Region).filter(Region.code == region_in.code, Region.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Region with this code already exists")

    update_data = region_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_region, key, value)
    
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_region(id: str, db: Session = Depends(deps.get_db)):
    db_region = db.query(Region).filter(Region.id == id).first()
    if not db_region:
        raise HTTPException(status_code=404, detail="Region not found")
    db.delete(db_region)
    db.commit()
    return None
