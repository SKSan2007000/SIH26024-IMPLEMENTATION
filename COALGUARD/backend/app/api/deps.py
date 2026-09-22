from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.mine import Mine

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: Optional[str] = Depends(reusable_oauth2)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = payload.get("sub")
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.query(User).filter(User.id == token_data).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        role_value = user.role if isinstance(user.role, str) else user.role.value
        if role_value not in self.allowed_roles and "HEAD_ADMIN" not in [role_value]:
            if role_value not in self.allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Operation not permitted for role {role_value}"
                )
        return user

def require_role(allowed_roles: list):
    return RoleChecker(allowed_roles)

def get_accessible_mine_ids(user: User, db: Session) -> list[str]:
    from app.models.mine import Mine
    role_value = user.role if isinstance(user.role, str) else user.role.value
    
    if role_value in ["HEAD_ADMIN", "AUDITOR_REGULATOR"]:
        # Can access all mines
        mines = db.query(Mine).all()
        return [m.id for m in mines]
    elif role_value == "REGIONAL_MANAGER":
        if not user.region_id:
            mines = db.query(Mine).all()
            return [m.id for m in mines]
        mines = db.query(Mine).filter(Mine.region_id == user.region_id).all()
        return [m.id for m in mines]
    elif role_value == "AREA_MANAGER":
        if not user.area_id:
            mines = db.query(Mine).all()
            return [m.id for m in mines]
        mines = db.query(Mine).filter(Mine.area_id == user.area_id).all()
        return [m.id for m in mines]
    else:
        # MINE_MANAGER, SUPERVISOR, SAFETY_OFFICER, ENVIRONMENTAL_OFFICER, CONTRACTOR_OFFICER, FIELD_OFFICER
        if not user.mine_id:
            # Fallback to all mines if mine_id is unassigned in demo mode
            mines = db.query(Mine).all()
            return [m.id for m in mines]
        return [user.mine_id]

class MineAccessChecker:
    def __call__(self, mine_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mine not found"
            )
        accessible_mines = get_accessible_mine_ids(user, db)
        if mine_id not in accessible_mines:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this mine's data"
            )
        return mine_id

require_mine_access = MineAccessChecker()
