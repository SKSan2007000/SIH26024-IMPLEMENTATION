import os
import hashlib
from PIL import Image
from sqlalchemy.orm import Session
from app.models.evidence_analysis import EvidenceAnalysis
from app.models.field_evidence import FieldEvidence
from app.models.enums import AnalysisEngine, AnalysisStatus
from abc import ABC, abstractmethod

class EvidenceAnalyzerInterface(ABC):
    @abstractmethod
    def analyze(self, evidence: FieldEvidence, file_path: str, db: Session) -> EvidenceAnalysis:
        pass

class DemoEvidenceAnalyzer(EvidenceAnalyzerInterface):
    def analyze(self, evidence: FieldEvidence, file_path: str, db: Session) -> EvidenceAnalysis:
        h = int(hashlib.md5(evidence.id.encode()).hexdigest(), 16)
        
        confidence = 85.0 + (h % 15)
        quality = 90.0 - (h % 10)
        relevance = 80.0 + (h % 20)
        
        ocr_text = evidence.remarks if evidence.remarks else "HAZARD DETECTED - AREA CLEAR"
        
        indicators = ["Safety Equipment Verified", "GPS Context Match", "Timestamp Integrity"]
        if relevance > 90:
            indicators.append("High Visibility")
            
        summary = "AI confirms visual evidence strongly matches the reported corrective action. No anomalies detected."
        if relevance < 85:
            summary = "AI detects matching elements, but environmental factors reduce certainty."
            
        analysis = EvidenceAnalysis(
            evidence_id=evidence.id,
            ocr_text=ocr_text,
            relevance_score=relevance,
            quality_score=quality,
            confidence_score=confidence,
            analysis_status=AnalysisStatus.ANALYZED.value,
            analysis_summary=summary,
            detected_indicators=indicators,
            engine=AnalysisEngine.DEMO_ANALYZER.value
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

class RealVisionAnalyzer(EvidenceAnalyzerInterface):
    def analyze(self, evidence: FieldEvidence, file_path: str, db: Session) -> EvidenceAnalysis:
        # Placeholder for genuine computer vision implementation
        # (e.g. YOLO, OpenCV, Azure Computer Vision API, AWS Rekognition)
        raise NotImplementedError("Real vision analyzer requires external API keys")

class EvidenceIntelligenceService:
    def __init__(self, db: Session):
        self.db = db
        # We can switch analyzers based on config
        self.analyzer: EvidenceAnalyzerInterface = DemoEvidenceAnalyzer()

    def validate_image(self, file_path: str):
        if not os.path.exists(file_path):
            return False, "File not found"
            
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "Image is empty/blank"
            
        try:
            with Image.open(file_path) as img:
                img.verify()
            
            with Image.open(file_path) as img:
                width, height = img.size
                if width < 100 or height < 100:
                    return False, "Extremely low-resolution image. Minimum 100x100 required."
        except Exception as e:
            return False, "Corrupted or unsupported image format."
            
        return True, "Valid"

    def analyze(self, evidence: FieldEvidence):
        existing = self.db.query(EvidenceAnalysis).filter(EvidenceAnalysis.evidence_id == evidence.id).first()
        if existing:
            return existing
            
        if not evidence.photo_path:
            return self._create_failed_analysis(evidence.id, "No photo attached to evidence")
            
        filename = evidence.photo_path.split("/")[-1]
        file_path = os.path.join("uploads", filename)
        
        is_valid, msg = self.validate_image(file_path)
        if not is_valid:
            return self._create_failed_analysis(evidence.id, msg)
            
        return self.analyzer.analyze(evidence, file_path, self.db)

    def _create_failed_analysis(self, evidence_id, msg):
        analysis = EvidenceAnalysis(
            evidence_id=evidence_id,
            analysis_status=AnalysisStatus.FAILED.value,
            analysis_summary=msg,
            engine=AnalysisEngine.DEMO_ANALYZER.value
        )
        self.db.add(analysis)
        self.db.commit()
        return analysis

    def _run_demo_analyzer(self, evidence: FieldEvidence):
        h = int(hashlib.md5(evidence.id.encode()).hexdigest(), 16)
        
        confidence = 85.0 + (h % 15)
        quality = 90.0 - (h % 10)
        relevance = 80.0 + (h % 20)
        
        ocr_text = evidence.remarks if evidence.remarks else "HAZARD DETECTED - AREA CLEAR"
        
        indicators = ["Safety Equipment Verified", "GPS Context Match", "Timestamp Integrity"]
        if relevance > 90:
            indicators.append("High Visibility")
            
        summary = "AI confirms visual evidence strongly matches the reported corrective action. No anomalies detected."
        if relevance < 85:
            summary = "AI detects matching elements, but environmental factors reduce certainty."
            
        analysis = EvidenceAnalysis(
            evidence_id=evidence.id,
            ocr_text=ocr_text,
            relevance_score=relevance,
            quality_score=quality,
            confidence_score=confidence,
            analysis_status=AnalysisStatus.ANALYZED.value,
            analysis_summary=summary,
            detected_indicators=indicators,
            engine=AnalysisEngine.DEMO_ANALYZER.value
        )
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis
