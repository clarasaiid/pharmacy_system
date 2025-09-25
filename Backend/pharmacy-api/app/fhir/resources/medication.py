# app/fhir/resources/medication.py
from fhir.resources.medication import Medication
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from typing import Optional
from pydantic import BaseModel

class MedicationResource(BaseModel):
    @staticmethod
    def create_medication(
        code: str,
        display: str,
        system: str = "http://snomed.info/sct",
        status: str = "active",
        manufacturer: Optional[str] = None,
        form: Optional[str] = None,
        strength: Optional[str] = None
    ) -> Medication:
        coding = Coding(system=system, code=code, display=display)
        codeable_concept = CodeableConcept(coding=[coding], text=display)

        return Medication(
            code=codeable_concept,
            status=status,
            manufacturer={"display": manufacturer} if manufacturer else None,
            form={"text": form} if form else None,
            strength={"text": strength} if strength else None
        )
