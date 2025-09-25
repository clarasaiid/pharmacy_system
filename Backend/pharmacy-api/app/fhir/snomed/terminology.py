import json, os
from pathlib import Path
from typing import Optional, List, Dict

class SNOMEDCTTerminology:
    """Loads and provides SNOMED CT concept data"""

    def __init__(self, snomed_data_path: Optional[str] = None):
        self.snomed_data_path = snomed_data_path or os.getenv("SNOMED_DATA_PATH")
        self.concepts: Dict[str, dict] = {}
        self.relationships: Dict[str, List[dict]] = {}

    def load_concepts(self):
        """Load SNOMED CT concepts from a local JSON file"""
        if not self.snomed_data_path:
            raise ValueError("SNOMED CT data path not configured")

        concepts_file = Path(self.snomed_data_path) / "concepts.json"
        if concepts_file.exists():
            with open(concepts_file) as f:
                self.concepts = json.load(f)
        else:
            raise FileNotFoundError(f"Concept file not found at {concepts_file}")

    def get_concept(self, concept_id: str) -> Optional[dict]:
        """Return a concept dict (with display, form, etc.) by SNOMED ID"""
        return self.concepts.get(concept_id)

    def search_concepts(self, term: str) -> List[dict]:
        """Search for SNOMED concepts by keyword (e.g., 'paracetamol')"""
        return [
            concept for concept in self.concepts.values()
            if term.lower() in concept.get("display", "").lower()
        ]
