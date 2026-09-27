from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.department import Department
from app.models.mine import Mine
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter()

@router.get("/", response_model=List[DepartmentResponse])
def read_departments(db: Session = Depends(deps.get_db)):
    return db.query(Department).all()

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(deps.get_db)):
    if not db.query(Mine).filter(Mine.id == dept_in.mine_id).first():
        raise HTTPException(status_code=400, detail="Mine not found")
        
    db_dept = Department(**dept_in.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/{id}", response_model=DepartmentResponse)
def read_department(id: str, db: Session = Depends(deps.get_db)):
    db_dept = db.query(Department).filter(Department.id == id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_dept
