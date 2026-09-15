from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import User
from app.models.region import Region
from app.models.area import Area
from app.models.mine import Mine
from app.models.department import Department
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    from app.api.deps import get_accessible_mine_ids
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val == "HEAD_ADMIN":
        return db.query(User).all()
    else:
        mine_ids = get_accessible_mine_ids(current_user, db)
        return db.query(User).filter(User.mine_id.in_(mine_ids)).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "HEAD_ADMIN":
        raise HTTPException(status_code=403, detail="Only HEAD_ADMIN can create users")
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    if user_in.region_id and not db.query(Region).filter(Region.id == user_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
    if user_in.area_id and not db.query(Area).filter(Area.id == user_in.area_id).first():
        raise HTTPException(status_code=400, detail="Area not found")
    if user_in.mine_id and not db.query(Mine).filter(Mine.id == user_in.mine_id).first():
        raise HTTPException(status_code=400, detail="Mine not found")
    if user_in.department_id and not db.query(Department).filter(Department.id == user_in.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")

    user_data = user_in.model_dump(exclude={"password"})
    user_data["password_hash"] = get_password_hash(user_in.password)
    
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{id}", response_model=UserResponse)
def read_user(id: str, db: Session = Depends(deps.get_db)):
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{id}", response_model=UserResponse)
def update_user(id: str, user_in: UserUpdate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "HEAD_ADMIN":
        raise HTTPException(status_code=403, detail="Only HEAD_ADMIN can update users")
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email, User.id != id).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")

    if user_in.region_id and not db.query(Region).filter(Region.id == user_in.region_id).first():
        raise HTTPException(status_code=400, detail="Region not found")
    if user_in.area_id and not db.query(Area).filter(Area.id == user_in.area_id).first():
        raise HTTPException(status_code=400, detail="Area not found")
    if user_in.mine_id and not db.query(Mine).filter(Mine.id == user_in.mine_id).first():
        raise HTTPException(status_code=400, detail="Mine not found")
    if user_in.department_id and not db.query(Department).filter(Department.id == user_in.department_id).first():
        raise HTTPException(status_code=400, detail="Department not found")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: str, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_val != "HEAD_ADMIN":
        raise HTTPException(status_code=403, detail="Only HEAD_ADMIN can delete users")
    db_user = db.query(User).filter(User.id == id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return None
