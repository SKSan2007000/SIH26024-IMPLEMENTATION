from app.api.deps import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.models.compliance_document import ComplianceDocument
from app.models.mine import Mine
from app.schemas.compliance_document import ComplianceDocumentCreate, ComplianceDocumentUpdate, ComplianceDocumentResponse
from app.models.enums import DocumentStatus
from app.api.deps import get_current_user, get_accessible_mine_ids, require_mine_access
from app.models.user import User

router = APIRouter()

def auto_detect_status(expiry_date: datetime) -> DocumentStatus:
    now = datetime.now(timezone.utc)
    if expiry_date.tzinfo is None:
        now = now.replace(tzinfo=None)
    
    if expiry_date < now:
        return DocumentStatus.EXPIRED
    elif (expiry_date - now).days <= 30:
        return DocumentStatus.EXPIRING
    return DocumentStatus.VALID

from fastapi import UploadFile, File, Form
from app.services.ocr_service import DemoOCRAnalyzer

@router.post("/documents/upload_ocr", response_model=ComplianceDocumentResponse, status_code=201)
async def upload_document_ocr(
    mine_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_mine_access(mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
        
    # In a real app we'd save the file and pass the path. For demo, we just use a dummy path.
    ocr_analyzer = DemoOCRAnalyzer()
    text = ocr_analyzer.extract_text("dummy_path")
    parsed_data = ocr_analyzer.parse_compliance_data(text)
    
    expiry_date = parsed_data.get("expiry_date")
    if not expiry_date:
        expiry_date = datetime.now(timezone.utc)
        
    status = auto_detect_status(expiry_date)
    
    doc = ComplianceDocument(
        mine_id=mine_id,
        document_type=parsed_data.get("document_type", "OTHER"),
        document_name=parsed_data.get("document_name", file.filename),
        status=status,
        expiry_date=expiry_date
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/documents", response_model=ComplianceDocumentResponse, status_code=201)
def create_document(document_in: ComplianceDocumentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_mine_access(document_in.mine_id, current_user, db)
    mine = db.query(Mine).filter(Mine.id == document_in.mine_id).first()
    if not mine:
        raise HTTPException(status_code=400, detail="Invalid mine_id")
        
    data = document_in.model_dump()
    if not document_in.status:
        data["status"] = auto_detect_status(document_in.expiry_date)
        
    db_obj = ComplianceDocument(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/documents", response_model=List[ComplianceDocumentResponse])
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mine_ids = get_accessible_mine_ids(current_user, db)
    return db.query(ComplianceDocument).filter(ComplianceDocument.mine_id.in_(mine_ids)).offset(skip).limit(limit).all()

@router.get("/documents/{document_id}", response_model=ComplianceDocumentResponse)
def read_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(ComplianceDocument).filter(ComplianceDocument.id == document_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Document not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    return db_obj

@router.put("/documents/{document_id}", response_model=ComplianceDocumentResponse)
def update_document(document_id: str, document_in: ComplianceDocumentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(ComplianceDocument).filter(ComplianceDocument.id == document_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Document not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    update_data = document_in.model_dump(exclude_unset=True)
    if "expiry_date" in update_data and "status" not in update_data:
        update_data["status"] = auto_detect_status(update_data["expiry_date"])
        
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(ComplianceDocument).filter(ComplianceDocument.id == document_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Document not found")
    require_mine_access(db_obj.mine_id, current_user, db)
    db.delete(db_obj)
    db.commit()
    return {"ok": True}
