from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.mine import Mine
from app.models.area import Area
from app.models.region import Region
from app.schemas.mine import MineCreate, MineUpdate, MineResponse

router = APIRouter()

@router.get("/", response_model=List[MineResponse])
def read_mines(db: Session = Depends(deps.get_db)):
    return db.query(Mine).all()

@router.post("/", response_model=MineResponse, status_code=status.HTTP_201_CREATED)
def create_mine(mine_in: MineCreate, db: Session = Depends(deps.get_db)):
    if not db.query(Region).filter(Region.id == mine_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
    if not db.query(Area).filter(Area.id == mine_in.area_id).first():
        raise HTTPException(status_code=400, detail="Area not found")
        
    ALLOWED_MINES = ["SECL-GEVRA", "SECL-KUSMUNDA", "SECL-DIPKA"]
    if mine_in.code not in ALLOWED_MINES:
        raise HTTPException(status_code=400, detail="Only canonical SECL mines are permitted in this dataset.")
        
    db_mine = db.query(Mine).filter(Mine.code == mine_in.code).first()
    if db_mine:
        raise HTTPException(status_code=400, detail="Mine with this code already exists")
        
    db_mine = Mine(**mine_in.model_dump())
    db.add(db_mine)
    db.commit()
    db.refresh(db_mine)
    return db_mine

@router.get("/{id}", response_model=MineResponse)
def read_mine(id: str, db: Session = Depends(deps.get_db)):
    db_mine = db.query(Mine).filter(Mine.id == id).first()
    if not db_mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    return db_mine

@router.put("/{id}", response_model=MineResponse)
def update_mine(id: str, mine_in: MineUpdate, db: Session = Depends(deps.get_db)):
    db_mine = db.query(Mine).filter(Mine.id == id).first()
    if not db_mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    if mine_in.region_id and not db.query(Region).filter(Region.id == mine_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
    if mine_in.area_id and not db.query(Area).filter(Area.id == mine_in.area_id).first():
        raise HTTPException(status_code=400, detail="Area not found")
    
    if mine_in.code:
        ALLOWED_MINES = ["SECL-GEVRA", "SECL-KUSMUNDA", "SECL-DIPKA"]
        if mine_in.code not in ALLOWED_MINES:
            raise HTTPException(status_code=400, detail="Only canonical SECL mines are permitted in this dataset.")
            
        existing = db.query(Mine).filter(Mine.code == mine_in.code, Mine.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Mine with this code already exists")

    update_data = mine_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_mine, key, value)
    
    db.add(db_mine)
    db.commit()
    db.refresh(db_mine)
    return db_mine

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mine(id: str, db: Session = Depends(deps.get_db)):
    db_mine = db.query(Mine).filter(Mine.id == id).first()
    if not db_mine:
        raise HTTPException(status_code=404, detail="Mine not found")
    db.delete(db_mine)
    db.commit()
    return None
