
# app/fhir/resources/medication_request.py
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.reference import Reference
from fhir.resources.dosage import Dosage
from fhir.resources.timing import Timing
from fhir.resources.codeableconcept import CodeableConcept
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class MedicationRequestResource(BaseModel):
    @staticmethod
    def create_medication_request(
        medication_reference: str,
        patient_reference: str,
        practitioner_reference: str,
        status: str = "active",
        intent: str = "order",
        dosage_instructions: Optional[List[dict]] = None,
        priority: str = "routine",
        authored_on: Optional[datetime] = None
    ) -> MedicationRequest:
        medication_request = MedicationRequest(
            status=status,
            intent=intent,
            medication=Reference(reference=medication_reference),
            subject=Reference(reference=patient_reference),
            requester=Reference(reference=practitioner_reference),
            priority=priority,
            authoredOn=authored_on or datetime.now().isoformat()
        )

        if dosage_instructions:
            medication_request.dosageInstruction = [
                Dosage(
                    text=inst.get("text"),
                    timing=Timing(**inst.get("timing", {})),
                    route=CodeableConcept(**inst.get("route", {})),
                    doseAndRate=inst.get("doseAndRate", [])
                ) for inst in dosage_instructions
            ]

        return medication_request