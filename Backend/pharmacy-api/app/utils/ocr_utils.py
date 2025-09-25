import pytesseract
from PIL import Image
import re
import os
from app.fhir.snomed.live_lookup import LiveSNOMEDLookup  # ✅ correct

class OCRProcessingError(Exception):
    """Raised when OCR processing fails."""
    pass

class PrescriptionDataExtractor:
    def __init__(self, tesseract_cmd: str = None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def extract(self, image_path: str) -> dict:
        if not os.path.exists(image_path):
            raise OCRProcessingError(f"Image file not found: {image_path}")
        
        try:
            image = Image.open(image_path)
            raw_text = pytesseract.image_to_string(image)
            if not raw_text.strip():
                raise OCRProcessingError("No text found in image.")

            cleaned_text = self._clean_text(raw_text)
            extracted_meds = self._parse_medications(cleaned_text)
            matched_snomed = self._match_snomed(extracted_meds)

            return {
                "raw_text": raw_text,
                "cleaned_text": cleaned_text,
                "medications": matched_snomed
            }

        except Exception as e:
            raise OCRProcessingError(f"OCR failed: {str(e)}")

    def _clean_text(self, text: str) -> str:
        return text.strip().replace("\n", " ").replace("\r", "").lower()

    def _parse_medications(self, text: str) -> list:
        """
        Extract medication name and dosage using regex.
        Example match: Paracetamol 500mg
        """
        pattern = r'\b([A-Za-z]+)\s+(\d+mg|\d+ml)\b'
        matches = re.findall(pattern, text)
        return [{"name": name, "dosage": dosage} for name, dosage in matches]

    def _match_snomed(self, meds: list) -> list:
        """
        Search for SNOMED CT concept by name using Snowstorm API.
        """
        matched = []
        for med in meds:
            try:
                concept = LiveSNOMEDLookup.search_concept_by_name(med["name"])
            except Exception as e:
                concept = None

            matched.append({
                "name": med["name"],
                "dosage": med["dosage"],
                "snomed": concept  # {'code': ..., 'display': ...} or None
            })
        return matched
