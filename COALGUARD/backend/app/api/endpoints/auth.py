from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "FIELD_OFFICER"
    mine_id: Optional[str] = None
    region_id: Optional[str] = None
    area_id: Optional[str] = None
    department_id: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    email: str
    mine_id: Optional[str] = None
    mine_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    region_id: Optional[str] = None
    area_id: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    role_val = user.role if isinstance(user.role, str) else user.role.value
    mine_name = user.mine.name if user.mine else None
    department_name = user.department.name if user.department else None
    
    token_data = {
        "sub": user.id,
        "role": role_val,
        "email": user.email,
        "mine_id": user.mine_id,
        "department_id": user.department_id,
        "region_id": user.region_id,
        "area_id": user.area_id,
        "full_name": user.full_name
    }
    
    access_token = security.create_access_token(
        token_data, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role=role_val,
        full_name=user.full_name,
        email=user.email,
        mine_id=user.mine_id,
        mine_name=mine_name,
        department_id=user.department_id,
        department_name=department_name,
        region_id=user.region_id,
        area_id=user.area_id
    )

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    req: UserRegisterRequest,
    db: Session = Depends(deps.get_db)
):
    """Register a new user account"""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    role_enum = UserRole.FIELD_OFFICER
    try:
        if req.role:
            role_enum = UserRole(req.role)
    except ValueError:
        role_enum = UserRole.FIELD_OFFICER
        
    new_user = User(
        email=req.email,
        full_name=req.full_name,
        password_hash=security.get_password_hash(req.password),
        role=role_enum,
        mine_id=req.mine_id,
        region_id=req.region_id,
        area_id=req.area_id,
        department_id=req.department_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value if hasattr(new_user.role, "value") else str(new_user.role)
    }

@router.get("/me")
def get_current_user_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get the current logged-in user's profile"""
    mine_name = current_user.mine.name if current_user.mine else None
    department_name = current_user.department.name if current_user.department else None
    
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "mine_id": current_user.mine_id,
        "mine_name": mine_name,
        "department_id": current_user.department_id,
        "department_name": department_name,
        "region_id": current_user.region_id,
        "area_id": current_user.area_id,
    }

@router.post("/refresh")
def refresh_token(
    current_user: User = Depends(deps.get_current_user)
):
    """Refresh JWT access token"""
    role_val = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    token_data = {
        "sub": current_user.id,
        "role": role_val,
        "email": current_user.email,
        "mine_id": current_user.mine_id,
        "full_name": current_user.full_name
    }
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(token_data, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout_user():
    """Logout endpoint"""
    return {"message": "Logged out successfully"}
