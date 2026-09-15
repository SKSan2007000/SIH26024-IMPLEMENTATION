import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.mine import Mine
from app.models.department import Department
from app.models.region import Region
from app.core.security import get_password_hash

def seed_users():
    db = SessionLocal()
    try:
        # Get Northern Region and Gevra Mine
        region = db.query(Region).filter(Region.code == "NR").first()
        gevra = db.query(Mine).filter(Mine.name == "Gevra Open Cast Mine").first()
        
        if not gevra or not region:
            print("Required baseline data (Gevra mine, Northern region) not found. Run base seed first.")
            return

        deps = {d.type.value if hasattr(d.type, 'value') else d.type: d.id for d in db.query(Department).filter(Department.mine_id == gevra.id).all()}
        
        demo_users = [
            {
                "full_name": "Demo Mine Manager",
                "email": "manager.gevra@coalguard.local",
                "role": "MINE_MANAGER",
                "mine_id": gevra.id,
                "department_id": None
            },
            {
                "full_name": "Demo Environmental Officer",
                "email": "env.gevra@coalguard.local",
                "role": "ENVIRONMENTAL_OFFICER",
                "mine_id": gevra.id,
                "department_id": deps.get("ENVIRONMENT")
            },
            {
                "full_name": "Demo Contractor Officer",
                "email": "contractor.gevra@coalguard.local",
                "role": "CONTRACTOR_OFFICER",
                "mine_id": gevra.id,
                "department_id": deps.get("CONTRACTOR")
            },
            {
                "full_name": "Demo Field Officer",
                "email": "field.gevra@coalguard.local",
                "role": "FIELD_OFFICER",
                "mine_id": gevra.id,
                "department_id": deps.get("INSPECTION")
            },
            {
                "full_name": "Demo Regional Manager",
                "email": "regional@coalguard.local",
                "role": "REGIONAL_MANAGER",
                "region_id": region.id,
                "mine_id": None,
                "department_id": None
            },
            {
                "full_name": "Demo Auditor",
                "email": "auditor@coalguard.local",
                "role": "AUDITOR_REGULATOR",
                "mine_id": None,
                "department_id": None
            }
        ]

        hashed_password = get_password_hash("demo123")
        count = 0

        for user_data in demo_users:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                new_user = User(
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    password_hash=hashed_password,
                    role=user_data["role"],
                    region_id=user_data.get("region_id"),
                    mine_id=user_data.get("mine_id"),
                    department_id=user_data.get("department_id"),
                    is_active=True
                )
                db.add(new_user)
                count += 1
                
        db.commit()
        print(f"Successfully seeded {count} demo users.")

    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
