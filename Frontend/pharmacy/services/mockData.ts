import { Prescription } from '@/components/prescriptions/PrescriptionCard';

export const mockPrescriptions: Prescription[] = [
  {
    id: 'RX12345',
    patientName: 'Sarah Johnson',
    patientImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    doctorName: 'Dr. Michael Rivera',
    date: new Date(2025, 1, 15),
    status: 'pending',
    items: 3,
    imageUrl: 'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg',
    drugName: 'Cyclophosphamide',
    dosage: '500 mg/m²',
    administrationRoute: 'IV',
    frequency: 'Every 3 weeks',
  },
  {
    id: 'RX12346',
    patientName: 'David Wilson',
    patientImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    doctorName: 'Dr. Sophia Liu',
    date: new Date(2025, 1, 14),
    status: 'processing',
    items: 2,
    drugName: 'Doxorubicin',
    dosage: '60 mg/m²',
    administrationRoute: 'IV',
    frequency: 'Every 2 weeks',
  },
];

export const getMockPrescriptions = () => {
  return Promise.resolve({
    entry: mockPrescriptions.map(prescription => ({
      resource: {
        identifier: [{ value: prescription.id }],
        subject: { display: prescription.patientName },
        requester: { display: prescription.doctorName },
        authoredOn: prescription.date.toISOString(),
        status: prescription.status,
        dispenseRequest: { quantity: { value: prescription.items } },
        medicationCodeableConcept: { text: prescription.drugName },
        dosageInstruction: [
          {
            doseAndRate: [{ doseQuantity: { value: parseFloat(prescription.dosage), unit: 'mg' } }],
            route: { text: prescription.administrationRoute },
            timing: { repeat: { frequency: 1, periodUnit: prescription.frequency } },
          },
        ],
      },
    })),
  });
}; 