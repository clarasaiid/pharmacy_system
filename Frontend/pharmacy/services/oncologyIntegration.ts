import { Prescription } from '@/components/prescriptions/PrescriptionCard';
import { apiRequest } from '@/config/api';

// FHIR Resource Types
export enum FhirResourceType {
  MedicationRequest = 'MedicationRequest',
  Patient = 'Patient',
  Practitioner = 'Practitioner',
  Medication = 'Medication',
}

// FHIR MedicationRequest Status
export enum MedicationRequestStatus {
  Active = 'active',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
  Completed = 'completed',
  EnteredInError = 'entered-in-error',
  Stopped = 'stopped',
  Draft = 'draft',
  Unknown = 'unknown',
}

// FHIR Integration Configuration
export const ONCOLOGY_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_ONCOLOGY_API_URL || 'https://oncology-api.example.com/fhir',
  headers: {
    'Content-Type': 'application/fhir+json',
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_ONCOLOGY_API_KEY}`,
  },
};

// Convert FHIR MedicationRequest to Prescription
export const fhirToPrescription = (fhirResource: any): Prescription => {
  return {
    id: fhirResource.identifier?.[0]?.value || `RX${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    patientName: fhirResource.subject?.display || 'Unknown Patient',
    patientImage: fhirResource.subject?.photo?.[0]?.url,
    doctorName: fhirResource.requester?.display || 'Unknown Doctor',
    date: new Date(fhirResource.authoredOn),
    status: mapFhirStatusToPrescriptionStatus(fhirResource.status),
    items: fhirResource.dispenseRequest?.quantity?.value || 1,
    imageUrl: fhirResource.supportingInfo?.[0]?.valueAttachment?.url,
    drugName: fhirResource.medicationCodeableConcept?.text || 'Unknown Drug',
    dosage: formatDosage(fhirResource.dosageInstruction?.[0]),
    administrationRoute: fhirResource.dosageInstruction?.[0]?.route?.text || 'N/A',
    frequency: formatFrequency(fhirResource.dosageInstruction?.[0]?.timing),
    pharmacistNotes: fhirResource.note?.[0]?.text,
    lastUpdated: fhirResource.meta?.lastUpdated ? {
      timestamp: new Date(fhirResource.meta.lastUpdated),
      pharmacistId: fhirResource.meta?.versionId || 'PHARM001'
    } : undefined,
  };
};

// Convert Prescription to FHIR MedicationRequest
export const prescriptionToFhir = (prescription: Prescription): any => {
  return {
    resourceType: FhirResourceType.MedicationRequest,
    identifier: [{ value: prescription.id }],
    status: mapPrescriptionStatusToFhir(prescription.status),
    intent: 'order',
    subject: {
      display: prescription.patientName,
      photo: prescription.patientImage ? [{ url: prescription.patientImage }] : undefined,
    },
    requester: { display: prescription.doctorName },
    authoredOn: prescription.date.toISOString(),
    dispenseRequest: {
      quantity: { value: prescription.items },
    },
    medicationCodeableConcept: { text: prescription.drugName },
    dosageInstruction: [
      {
        text: `${prescription.dosage} ${prescription.administrationRoute} ${prescription.frequency}`,
        route: { text: prescription.administrationRoute },
        doseAndRate: [
          {
            doseQuantity: parseDosage(prescription.dosage),
          },
        ],
        timing: parseFrequency(prescription.frequency),
      },
    ],
    note: prescription.pharmacistNotes ? [{ text: prescription.pharmacistNotes }] : undefined,
  };
};

// Helper Functions
const mapFhirStatusToPrescriptionStatus = (fhirStatus: string): Prescription['status'] => {
  const statusMap: Record<string, Prescription['status']> = {
    [MedicationRequestStatus.Active]: 'processing',
    [MedicationRequestStatus.OnHold]: 'onHold',
    [MedicationRequestStatus.Cancelled]: 'rejected',
    [MedicationRequestStatus.Completed]: 'completed',
    [MedicationRequestStatus.EnteredInError]: 'rejected',
    [MedicationRequestStatus.Stopped]: 'rejected',
    [MedicationRequestStatus.Draft]: 'pending',
    [MedicationRequestStatus.Unknown]: 'pending',
  };
  return statusMap[fhirStatus] || 'pending';
};

const mapPrescriptionStatusToFhir = (status: Prescription['status']): MedicationRequestStatus => {
  const statusMap: Record<Prescription['status'], MedicationRequestStatus> = {
    pending: MedicationRequestStatus.Draft,
    processing: MedicationRequestStatus.Active,
    completed: MedicationRequestStatus.Completed,
    rejected: MedicationRequestStatus.Cancelled,
    dispensed: MedicationRequestStatus.Completed,
    onHold: MedicationRequestStatus.OnHold,
    awaitingConfirmation: MedicationRequestStatus.Active,
  };
  return statusMap[status];
};

const formatDosage = (dosageInstruction: any): string => {
  if (!dosageInstruction?.doseAndRate?.[0]?.doseQuantity) return 'N/A';
  const { value, unit } = dosageInstruction.doseAndRate[0].doseQuantity;
  return `${value} ${unit}`;
};

const formatFrequency = (timing: any): string => {
  if (!timing?.repeat) return 'N/A';
  const { frequency, period, periodUnit } = timing.repeat;
  return `${frequency} times per ${period} ${periodUnit}`;
};

const parseDosage = (dosage: string): { value: number; unit: string } => {
  const match = dosage.match(/(\d+(?:\.\d+)?)\s*(.+)/);
  if (!match) return { value: 0, unit: 'mg' };
  return { value: parseFloat(match[1]), unit: match[2] };
};

const parseFrequency = (frequency: string): any => {
  const match = frequency.match(/(\d+)\s*times\s*per\s*(\d+)\s*(.+)/);
  if (!match) return { repeat: { frequency: 1, period: 1, periodUnit: 'day' } };
  return {
    repeat: {
      frequency: parseInt(match[1]),
      period: parseInt(match[2]),
      periodUnit: match[3],
    },
  };
};

// API Functions
export const syncPrescriptions = async () => {
  try {
    const response = await apiRequest(`${ONCOLOGY_CONFIG.baseUrl}/MedicationRequest`, {
      headers: ONCOLOGY_CONFIG.headers,
    });
    return response.entry.map((entry: any) => fhirToPrescription(entry.resource));
  } catch (error) {
    console.error('Oncology sync error:', error);
    throw error;
  }
};

export const updatePrescriptionStatus = async (
  prescriptionId: string,
  status: Prescription['status'],
  notes?: string
) => {
  try {
    const fhirStatus = mapPrescriptionStatusToFhir(status);
    const response = await apiRequest(
      `${ONCOLOGY_CONFIG.baseUrl}/MedicationRequest/${prescriptionId}`,
      {
        method: 'PUT',
        headers: ONCOLOGY_CONFIG.headers,
        body: JSON.stringify({
          resourceType: FhirResourceType.MedicationRequest,
          id: prescriptionId,
          status: fhirStatus,
          note: notes ? [{ text: notes }] : undefined,
        }),
      }
    );
    return fhirToPrescription(response);
  } catch (error) {
    console.error('Status update error:', error);
    throw error;
  }
};

export const subscribeToUpdates = (callback: (update: any) => void) => {
  // Implement WebSocket or Server-Sent Events connection
  const ws = new WebSocket(ONCOLOGY_CONFIG.baseUrl.replace('https', 'wss') + '/updates');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    callback(update);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return () => ws.close();
}; 