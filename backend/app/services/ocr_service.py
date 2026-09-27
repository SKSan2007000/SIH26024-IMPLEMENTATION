from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import re
import datetime

class OCRAnalyzerInterface(ABC):
    @abstractmethod
    def extract_text(self, file_path: str) -> str:
        """Extract raw text from a document or image."""
        pass

    @abstractmethod
    def parse_compliance_data(self, text: str) -> Dict[str, Any]:
        """Parse structured compliance data (e.g. expiry dates) from raw text."""
        pass

class DemoOCRAnalyzer(OCRAnalyzerInterface):
    def extract_text(self, file_path: str) -> str:
        # Fallback text extraction (mock for testing/demo)
        return "GOVERNMENT OF INDIA - MINISTRY OF COAL\nCOMPLIANCE CERTIFICATE\nValid until: 2027-12-31\nMine ID: SECL-GEVRA"

    def parse_compliance_data(self, text: str) -> Dict[str, Any]:
        result = {
            "document_name": "Extracted Certificate",
            "document_type": "CERTIFICATE",
            "expiry_date": None,
            "confidence": 0.0
        }
        
        # Real regex for compliance parsing
        expiry_match = re.search(r'(?:Valid until|Expiry Date|Valid To)[:\s]+(\d{4}-\d{2}-\d{2})', text, re.IGNORECASE)
        if expiry_match:
            try:
                date_str = expiry_match.group(1)
                result["expiry_date"] = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                result["confidence"] = 0.95
            except ValueError:
                pass
                
        type_match = re.search(r'(CERTIFICATE|LICENSE|PERMIT|CLEARANCE)', text, re.IGNORECASE)
        if type_match:
            result["document_type"] = type_match.group(1).upper()
            
        return result
