from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models.field_evidence import FieldEvidence
from app.models.corrective_action import CorrectiveAction
from app.models.user import User
from app.models.enums import UserRole, ActionStatus, AuditEventType
from app.models.governance import AuditLog
from app.models.evidence_analysis import EvidenceAnalysis
from app.schemas.field_evidence import FieldEvidenceResponse
from app.schemas.evidence_analysis import EvidenceAnalysisResponse
from app.services.evidence_intelligence_service import EvidenceIntelligenceService

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/", response_model=FieldEvidenceResponse, status_code=status.HTTP_201_CREATED)
async def submit_field_evidence(
    corrective_action_id: str = Form(...),
    mine_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: Optional[float] = Form(None),
    remarks: Optional[str] = Form(None),
    submitter_id: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. GPS Validation
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")

    # 2. Authorization & Data Integrity
    user = current_user
    if submitter_id:
        custom_user = db.query(User).filter(User.id == submitter_id).first()
        if custom_user:
            user = custom_user
    
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == corrective_action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Corrective Action not found")
        
    if action.mine_id != mine_id:
        raise HTTPException(status_code=400, detail="Action does not belong to specified mine")

    if user.role == UserRole.FIELD_OFFICER and action.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Field Officer can only submit evidence for their own assigned actions")

    # 3. File Upload Security
    photo_path = None
    if photo:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only JPEG, PNG, and WebP are allowed.")
            
        file_content = await photo.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
            
        # Generate safe unique filename
        ext = photo.filename.split('.')[-1] if '.' in photo.filename else 'bin'
        if ext.lower() not in ['jpg', 'jpeg', 'png', 'webp']:
            ext = 'bin'
        
        safe_filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(filepath, "wb") as f:
            f.write(file_content)
            
        photo_path = f"/uploads/{safe_filename}"

    # 4. Create Evidence Record
    evidence = FieldEvidence(
        corrective_action_id=action.id,
        mine_id=action.mine_id,
        submitted_by_user_id=user.id,
        photo_path=photo_path,
        latitude=latitude,
        longitude=longitude,
        accuracy=accuracy,
        remarks=remarks
    )
    db.add(evidence)
    
    # 5. Audit Logging
    audit = AuditLog(
        mine_id=action.mine_id,
        user_id=user.id,
        action_id=action.id,
        event_type=AuditEventType.FIELD_EVIDENCE_SUBMITTED,
        new_status="EVIDENCE_SUBMITTED",
        details={"action_id": action.id, "evidence_id": evidence.id, "reason": f"Field evidence submitted for action {action.title}"}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(evidence)
    return evidence

@router.post("/{action_id}/submit-for-review")
def submit_for_review(
    action_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user

    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if user.role == UserRole.FIELD_OFFICER and action.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Field Officer can only submit their own actions for review")

    # Check if evidence exists
    evidence_count = db.query(FieldEvidence).filter(FieldEvidence.corrective_action_id == action.id).count()
    if evidence_count == 0:
        raise HTTPException(status_code=400, detail="Cannot submit for review without field evidence")

    # Update Action Status
    action.status = ActionStatus.IN_REVIEW
    action.updated_at = datetime.now(timezone.utc)
    db.add(action)
    
    # Audit Log
    audit = AuditLog(
        mine_id=action.mine_id,
        user_id=user.id,
        action_id=action.id,
        event_type=AuditEventType.ACTION_SUBMITTED_FOR_REVIEW,
        previous_status=ActionStatus.IN_PROGRESS.value,
        new_status=ActionStatus.IN_REVIEW.value,
        details={"action_id": action.id, "reason": "Action submitted for review"}
    )
    db.add(audit)
    
    db.commit()
    return {"status": "ok", "action_status": action.status}

@router.get("/action/{action_id}", response_model=List[FieldEvidenceResponse])
def get_evidence_for_action(action_id: str, db: Session = Depends(get_db)):
    evidence = db.query(FieldEvidence).filter(FieldEvidence.corrective_action_id == action_id).order_by(FieldEvidence.created_at.desc()).all()
    return evidence

@router.get("/photo/{evidence_id}")
def get_photo(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
        
    evidence = db.query(FieldEvidence).filter(FieldEvidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == evidence.corrective_action_id).first()
    if user.role == UserRole.FIELD_OFFICER and action.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this photo")

    if not evidence.photo_path:
        raise HTTPException(status_code=404, detail="No photo for this evidence")
        
    # The photo path was saved as "/uploads/filename", we need to extract filename
    filename = evidence.photo_path.split("/")[-1]
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Photo file missing from server")
        
    return FileResponse(filepath)

@router.post("/{evidence_id}/analyze", response_model=EvidenceAnalysisResponse)
def analyze_evidence(
    evidence_id: str,
    user_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    if user_id:
        custom_user = db.query(User).filter(User.id == user_id).first()
        if custom_user:
            user = custom_user

    evidence = db.query(FieldEvidence).filter(FieldEvidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == evidence.corrective_action_id).first()
    
    if user.role == UserRole.FIELD_OFFICER and action.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this evidence")
        
    service = EvidenceIntelligenceService(db)
    analysis = service.analyze(evidence)
    
    # Audit log
    audit = AuditLog(
        mine_id=action.mine_id,
        user_id=user.id,
        action_id=action.id,
        event_type=AuditEventType.FIELD_EVIDENCE_ANALYZED,
        new_status=action.status,
        details={
            "evidence_id": evidence.id,
            "engine": analysis.engine,
            "confidence": analysis.confidence_score
        }
    )
    db.add(audit)
    db.commit()
    
    return analysis

@router.get("/{evidence_id}/analysis", response_model=EvidenceAnalysisResponse)
def get_evidence_analysis(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = current_user

    evidence = db.query(FieldEvidence).filter(FieldEvidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    analysis = db.query(EvidenceAnalysis).filter(EvidenceAnalysis.evidence_id == evidence_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    return analysis
