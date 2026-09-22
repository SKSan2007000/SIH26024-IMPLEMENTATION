import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.mine import Mine

def update():
    db = SessionLocal()
    mines = db.query(Mine).order_by(Mine.code).all()
    # SECL Mines
    coords = {
        "SECL-GEVRA": (22.338, 82.593),
        "SECL-KUSMUNDA": (22.332, 82.684),
        "SECL-DIPKA": (22.315, 82.548)
    }
    for mine in mines:
        if mine.code in coords:
            mine.latitude = coords[mine.code][0]
            mine.longitude = coords[mine.code][1]
    db.commit()
    print("Updated mine coordinates.")

if __name__ == "__main__":
    update()
