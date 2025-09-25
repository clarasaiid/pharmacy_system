import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, Plus, Camera, X, AlertCircle, RefreshCw, FileText, User, Calendar, Clock, CheckCircle, XCircle, Edit, AlertTriangle, Package, History, FileUp, Trash2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '@/components/ui/Header';
import PrescriptionCard, { Prescription } from '@/components/prescriptions/PrescriptionCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Colors from '@/constants/Colors';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text } from 'react-native';
import { API_CONFIG, apiRequest, ApiError } from '@/config/api';
import { 
  syncPrescriptions as syncOncologyPrescriptions, 
  updatePrescriptionStatus, 
  subscribeToUpdates,
  fhirToPrescription 
} from '@/services/oncologyIntegration';

// Sample data with new fields
const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'RX12345',
    patientName: 'Sarah Mohamed',
    patientId: 'P12345',
    doctorName: 'Dr. Ahmed Mahmoud',
    doctorDepartment: 'Oncology',
    date: new Date(2025, 1, 15),
    status: 'pending',
    items: 3,
    isClinicReferral: false,
    medications: [
      {
        drugName: 'Cyclophosphamide',
        dosage: '500 mg/m²',
        frequency: 'Every 3 weeks',
        duration: '6 cycles',
        quantity: 3,
        stockAvailable: 5,
        expiryDate: new Date(2025, 6, 15),
        isNearExpiry: false,
        isLowStock: true
      }
    ],
    auditLog: [
      {
        timestamp: new Date(),
        action: 'Created',
        userId: 'PH001',
        userRole: 'Pharmacist',
        notes: 'Initial prescription created'
      }
    ]
  },
  {
    id: 'RX12346',
    patientName: 'Mohammed Ali',
    patientId: 'P12346',
    doctorName: 'Dr. Fatima Hassan',
    doctorDepartment: 'Cardiology',
    date: new Date(2025, 1, 16),
    status: 'pending',
    items: 2,
    isClinicReferral: true,
    clinicInfo: {
      clinicName: 'City Medical Center',
      clinicId: 'CMC001',
      referralDate: new Date(2025, 1, 16),
      diagnosis: 'Hypertension and Type 2 Diabetes',
      patientDetails: {
        age: 65,
        gender: 'Male',
        allergies: ['Penicillin', 'Sulfa drugs'],
        medicalHistory: ['Hypertension (2018)', 'Type 2 Diabetes (2019)'],
        lastVisit: new Date(2025, 1, 16)
      }
    },
    medications: [
      {
        drugName: 'Metformin',
        dosage: '1000 mg',
        frequency: 'Twice daily',
        duration: '30 days',
        quantity: 60,
        stockAvailable: 100,
        isNearExpiry: false,
        isLowStock: false
      },
      {
        drugName: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
        duration: '30 days',
        quantity: 30,
        stockAvailable: 50,
        isNearExpiry: false,
        isLowStock: false
      }
    ],
    auditLog: [
      {
        timestamp: new Date(),
        action: 'Received from Clinic',
        userId: 'PH001',
        userRole: 'Pharmacist',
        notes: 'Clinic referral received'
      }
    ]
  }
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'filled', label: 'Filled' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'partially_filled', label: 'Partially Filled' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'dispensed', label: 'Dispensed' },
  { key: 'onHold', label: 'On Hold' },
  { key: 'awaitingConfirmation', label: 'Awaiting Confirmation' },
];

export default function PrescriptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    id: '',
    patientName: '',
    patientId: '',
    doctorName: '',
    doctorDepartment: '',
    date: new Date(),
    status: 'pending',
    items: 1,
    isClinicReferral: false,
    clinicInfo: {
      clinicName: '',
      clinicId: '',
      referralDate: new Date(),
      diagnosis: '',
      patientDetails: {
        age: 0,
        gender: '',
        allergies: [],
        medicalHistory: []
      }
    },
    medications: [{
      drugName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      stockAvailable: 0,
      isNearExpiry: false,
      isLowStock: false
    }],
    auditLog: [],
    patientImage: undefined,
    imageUrl: undefined,
    pharmacistNotes: '',
    lastUpdated: undefined,
    ocrResult: undefined,
    attachments: [],
    isEditable: true
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{
    name: string;
    id: string;
    age?: number;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
    medicalHistory?: string[];
    allergies?: string[];
    lastVisit?: Date;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubstituting, setIsSubstituting] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Prescription['medications'][0] | null>(null);
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'pharmacy' | 'clinic'>('pharmacy');

  // Check for add parameter and show modal if present
  useEffect(() => {
    if (add === 'true') {
      setIsAddModalVisible(true);
    }
  }, [add]);

  // Dosage calculation based on patient weight (placeholder)
  const calculateDosage = (dosageStr: string, patientWeight?: number) => {
    if (!patientWeight) return 'Enter patient weight (kg)';
    const match = dosageStr.match(/(\d+\.?\d*)\s*mg\/m²/);
    if (match) {
      const dosePerM2 = parseFloat(match[1]);
      const bsa = Math.sqrt((patientWeight * 1.6) / 36); // Simplified BSA calculation
      return `${(dosePerM2 * bsa).toFixed(2)} mg`;
    }
    return dosageStr;
  };

  // Function to fetch prescriptions from Oncology System
  const syncPrescriptions = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const fetchedPrescriptions = await syncOncologyPrescriptions();
      setPrescriptions(fetchedPrescriptions);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError('Failed to sync prescriptions. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add real-time updates subscription
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.resourceType === 'MedicationRequest') {
        setPrescriptions(prev => {
          const index = prev.findIndex(p => p.id === update.id);
          if (index === -1) {
            return [fhirToPrescription(update), ...prev];
          }
          const updated = [...prev];
          updated[index] = fhirToPrescription(update);
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to update prescription status and notify Oncology System
  const handleStatusUpdate = async (id: string, status: Prescription['status'], notes?: string) => {
    setIsUpdating(true);
    try {
      const updatedPrescription = await updatePrescriptionStatus(id, status, notes);
      
      // Add to audit log
      const auditEntry = {
        timestamp: new Date(),
        action: `Status changed to ${status}`,
        userId: 'PH001', // Replace with actual user ID
        userRole: 'Pharmacist',
        notes
      };

      setPrescriptions(prev =>
        prev.map(p => p.id === id ? {
          ...updatedPrescription,
          auditLog: [...(p.auditLog || []), auditEntry]
        } : p)
      );
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Error', 'Failed to update prescription status.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to handle cancellations from Oncology System
  const handleCancellation = async (prescriptionId: string) => {
    try {
      setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
      console.log(`Prescription ${prescriptionId} cancelled by Oncology System`);
    } catch (error) {
      console.error('Cancellation error:', error);
      Alert.alert('Error', 'Failed to process cancellation.');
    }
  };

  // Enhanced search with clear button
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = prescriptions.filter(
        prescription =>
          prescription.patientName.toLowerCase().includes(text.toLowerCase()) ||
          prescription.doctorName.toLowerCase().includes(text.toLowerCase()) ||
          prescription.id.toLowerCase().includes(text.toLowerCase()) ||
          prescription.medications[0].drugName.toLowerCase().includes(text.toLowerCase())
      );
      setPrescriptions(filtered);
    } else {
      filterPrescriptions(activeFilter);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    filterPrescriptions(activeFilter);
  };

  const filterPrescriptions = (filterKey: string) => {
    setActiveFilter(filterKey);
    if (filterKey === 'all') {
      syncPrescriptions();
    } else {
      const filtered = INITIAL_PRESCRIPTIONS.filter(prescription => prescription.status === filterKey);
      setPrescriptions(filtered);
    }
  };

  const handlePrescriptionPress = (prescription: Prescription) => {
    router.push({
      pathname: "/prescriptions",
      params: { id: prescription.id, patientId: prescription.patientName }
    });
  };

  const handleScanComplete = (prescriptionId: string, imageUrl: string, ocrResult: string) => {
    // Mock OCR parsing for drug details
    const parsedResult = ocrResult.match(/Drug: (\w+), Dosage: (\d+\s\w+), Route: (\w+)/);
    if (parsedResult) {
      const [, drugName, dosage, route] = parsedResult;
      setPrescriptions(prev =>
        prev.map(p =>
          p.id === prescriptionId ? { ...p, imageUrl, ocrResult } : p
        )
      );
      console.log('Parsed OCR Result:', { drugName, dosage, route });
    } else {
      setPrescriptions(prev =>
        prev.map(p => (p.id === prescriptionId ? { ...p, imageUrl } : p))
      );
      console.log('OCR Result:', ocrResult);
    }
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: newPrescription.date,
      onChange: (event: any, date: Date | undefined) => {
        if (date) setNewPrescription({ ...newPrescription, date });
      },
      mode: 'date',
      display: 'default',
    });
  };

  const handleAddPrescription = async () => {
    if (!newPrescription.patientName || !newPrescription.doctorName || 
        !newPrescription.medications[0].drugName || 
        !newPrescription.medications[0].dosage || 
        !newPrescription.medications[0].frequency || 
        newPrescription.items < 1) {
      Alert.alert('Error', 'Please fill all required fields and ensure items is at least 1.');
      return;
    }

    const newId = `RX${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const prescriptionToAdd: Prescription = { ...newPrescription, id: newId };

    try {
      const fhirPrescription = {
        resourceType: 'MedicationRequest',
        identifier: [{ value: newId }],
        status: newPrescription.status,
        subject: { display: newPrescription.patientName },
        requester: { display: newPrescription.doctorName },
        authoredOn: newPrescription.date.toISOString(),
        dispenseRequest: { quantity: { value: newPrescription.items } },
        medicationCodeableConcept: { text: newPrescription.medications[0].drugName },
        dosageInstruction: [
          {
            doseAndRate: [{ doseQuantity: { value: parseFloat(newPrescription.medications[0].dosage), unit: 'mg' } }],
            timing: { repeat: { frequency: 1, periodUnit: newPrescription.medications[0].frequency } },
          },
        ],
      };

      const response = await fetch('YOUR_ONCOLOGY_API_ENDPOINT/medication-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        },
        body: JSON.stringify(fhirPrescription),
      });

      if (!response.ok) throw new Error('Failed to add prescription to Oncology System');

      setPrescriptions([prescriptionToAdd, ...prescriptions]);
      setNewPrescription({
        id: '',
        patientName: '',
        patientId: '',
        doctorName: '',
        doctorDepartment: '',
        date: new Date(),
        status: 'pending',
        items: 1,
        isClinicReferral: false,
        clinicInfo: {
          clinicName: '',
          clinicId: '',
          referralDate: new Date(),
          diagnosis: '',
          patientDetails: {
            age: 0,
            gender: '',
            allergies: [],
            medicalHistory: []
          }
        },
        medications: [{
          drugName: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: 1,
          stockAvailable: 0,
          isNearExpiry: false,
          isLowStock: false
        }],
        auditLog: [],
        patientImage: undefined,
        imageUrl: undefined,
        pharmacistNotes: '',
        lastUpdated: undefined,
        ocrResult: undefined,
        attachments: [],
        isEditable: true
      });
      setIsAddModalVisible(false);
      Alert.alert('Success', 'Prescription added successfully.');
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert('Error', 'Failed to add prescription to Oncology System.');
    }
  };

  const handleCancelAdd = () => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to discard this prescription?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => setIsAddModalVisible(false), style: 'destructive' },
      ]
    );
  };

  const handleSubstitution = (medication: Prescription['medications'][0], substituteDrug: string, reason: string) => {
    if (!selectedMedication) return;
    
    const updatedMedication = {
      ...medication,
      substitution: {
        originalDrug: medication.drugName,
        substitutedDrug: substituteDrug,
        reason
      }
    };

    setPrescriptions(prev => 
      prev.map(p => ({
        ...p,
        medications: p.medications.map(m => 
          m === selectedMedication ? updatedMedication : m
        )
      }))
    );

    setIsSubstituting(false);
    setSelectedMedication(null);
  };

  const handleAttachmentUpload = async (prescriptionId: string, file: any) => {
    try {
      const attachment = {
        type: file.type === 'application/pdf' ? 'pdf' as const : 'image' as const,
        url: 'uploaded_file_url',
        name: file.name
      };

      setPrescriptions(prev =>
        prev.map(p => p.id === prescriptionId ? {
          ...p,
          attachments: [...(p.attachments || []), attachment]
        } : p)
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload attachment.');
    }
  };

  const handlePatientPress = (patientName: string, patientId: string) => {
    // In a real app, you would fetch this data from your API
    setSelectedPatient({
      name: patientName,
      id: patientId || 'N/A', // Ensure id is always a string
      age: 45,
      gender: 'Female',
      phone: '+20 123 456 7890',
      email: 'patient@example.com',
      address: '123 Medical Street, Cairo, Egypt',
      medicalHistory: [
        'Hypertension (2020)',
        'Type 2 Diabetes (2019)',
        'Previous Surgery: Appendectomy (2018)'
      ],
      allergies: [
        'Penicillin',
        'Sulfa drugs'
      ],
      lastVisit: new Date(2024, 1, 15)
    });
    setIsPatientModalVisible(true);
  };

  const handleClinicNameChange = (text: string) => {
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: text,
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handleClinicIdChange = (text: string) => {
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: text,
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handleDiagnosisChange = (text: string) => {
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: text,
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handlePatientAgeChange = (text: string) => {
    const age = parseInt(text) || 0;
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handlePatientGenderChange = (text: string) => {
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: text,
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handleAllergiesChange = (text: string) => {
    const allergies = text.split(',').map(item => item.trim()).filter(item => item);
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies,
          medicalHistory: prev.clinicInfo?.patientDetails?.medicalHistory || []
        }
      }
    }));
  };

  const handleMedicalHistoryChange = (text: string) => {
    const medicalHistory = text.split(',').map(item => item.trim()).filter(item => item);
    setNewPrescription(prev => ({
      ...prev,
      clinicInfo: {
        clinicName: prev.clinicInfo?.clinicName || '',
        clinicId: prev.clinicInfo?.clinicId || '',
        referralDate: prev.clinicInfo?.referralDate || new Date(),
        diagnosis: prev.clinicInfo?.diagnosis || '',
        patientDetails: {
          age: prev.clinicInfo?.patientDetails?.age || 0,
          gender: prev.clinicInfo?.patientDetails?.gender || '',
          allergies: prev.clinicInfo?.patientDetails?.allergies || [],
          medicalHistory
        }
      }
    }));
  };

  const renderItem = ({ item }: { item: Prescription }) => (
    <PrescriptionCard
      prescription={item}
      onPress={handlePrescriptionPress}
      onUpdateStatus={handleStatusUpdate}
      onScanComplete={handleScanComplete}
      isUpdating={isUpdating}
      onPatientPress={() => handlePatientPress(item.patientName, item.patientId || '')}
    />
  );

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter Prescriptions</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={Colors.gray[700]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterModalBody}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity style={styles.dateInput} onPress={() => DateTimePickerAndroid.open({
                value: dateRange.start,
                onChange: (event, date) => date && setDateRange(prev => ({ ...prev, start: date })),
                mode: 'date'
              })}>
                <Text>{dateRange.start.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <Text>to</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => DateTimePickerAndroid.open({
                value: dateRange.end,
                onChange: (event, date) => date && setDateRange(prev => ({ ...prev, end: date })),
                mode: 'date'
              })}>
                <Text>{dateRange.end.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Doctor</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Search doctor..."
              value={selectedDoctor}
              onChangeText={setSelectedDoctor}
            />

            <Text style={styles.filterLabel}>Patient</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Search patient..."
              value={selectedPatient?.name || ''}
              onChangeText={(text) => {
                if (selectedPatient) {
                  setSelectedPatient({
                    ...selectedPatient,
                    name: text
                  });
                }
              }}
            />

            <Button
              title="Apply Filters"
              variant="primary"
              onPress={() => {
                // Apply filters logic
                setShowFilters(false);
              }}
              style={styles.applyFilterButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSubstitutionModal = () => (
    <Modal visible={isSubstituting} animationType="slide" transparent>
      <View style={styles.substitutionModalContainer}>
        <View style={styles.substitutionModalContent}>
          <View style={styles.substitutionModalHeader}>
            <Text style={styles.substitutionModalTitle}>Substitute Medication</Text>
            <TouchableOpacity onPress={() => setIsSubstituting(false)}>
              <X size={24} color={Colors.gray[700]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.substitutionModalBody}>
            <Text style={styles.substitutionLabel}>Original Drug</Text>
            <Text style={styles.substitutionValue}>{selectedMedication?.drugName}</Text>

            <Text style={styles.substitutionLabel}>Substitute Drug</Text>
            <TextInput
              style={styles.substitutionInput}
              placeholder="Enter substitute drug name..."
            />

            <Text style={styles.substitutionLabel}>Reason for Substitution</Text>
            <TextInput
              style={[styles.substitutionInput, styles.substitutionTextArea]}
              placeholder="Enter reason for substitution..."
              multiline
              numberOfLines={4}
            />

            <Button
              title="Confirm Substitution"
              variant="primary"
              onPress={() => {
                // Implement substitution logic
                setIsSubstituting(false);
              }}
              style={styles.confirmSubstitutionButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderPatientModal = () => (
    <Modal
      visible={isPatientModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsPatientModalVisible(false)}
    >
      <View style={styles.patientModalContainer}>
        <View style={styles.patientModalContent}>
          <View style={styles.patientModalHeader}>
            <Text style={styles.patientModalTitle}>Patient Information</Text>
            <TouchableOpacity onPress={() => setIsPatientModalVisible(false)}>
              <X size={24} color={Colors.gray[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.patientModalBody}>
            {selectedPatient && (
              <>
                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Name</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.name}</Text>
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Patient ID</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.id}</Text>
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Age</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.age} years</Text>
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Gender</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.gender}</Text>
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Contact Information</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.phone}</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.email}</Text>
                  <Text style={styles.patientInfoValue}>{selectedPatient.address}</Text>
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Medical History</Text>
                  {selectedPatient.medicalHistory?.map((item, index) => (
                    <Text key={index} style={styles.patientInfoValue}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Allergies</Text>
                  {selectedPatient.allergies?.map((item, index) => (
                    <Text key={index} style={styles.patientInfoValue}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.patientInfoSection}>
                  <Text style={styles.patientInfoLabel}>Last Visit</Text>
                  <Text style={styles.patientInfoValue}>
                    {selectedPatient.lastVisit?.toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAddModal = () => (
    <Modal visible={isAddModalVisible} animationType="slide" onRequestClose={handleCancelAdd}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Add New {newPrescription.isClinicReferral ? 'Clinic Referral' : 'Prescription'}
          </Text>
          <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
            <X size={24} color={Colors.gray[700]} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
          <View style={styles.modalContentContainer}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Patient Name" 
              value={newPrescription.patientName} 
              onChangeText={text => setNewPrescription({ ...newPrescription, patientName: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Patient ID" 
              value={newPrescription.patientId} 
              onChangeText={text => setNewPrescription({ ...newPrescription, patientId: text })} 
            />

            {newPrescription.isClinicReferral && (
              <>
                <Text style={styles.sectionTitle}>Clinic Information</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Clinic Name" 
                  value={newPrescription.clinicInfo?.clinicName} 
                  onChangeText={handleClinicNameChange} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Clinic ID" 
                  value={newPrescription.clinicInfo?.clinicId} 
                  onChangeText={handleClinicIdChange} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Diagnosis" 
                  value={newPrescription.clinicInfo?.diagnosis} 
                  onChangeText={handleDiagnosisChange} 
                />

                <Text style={styles.sectionTitle}>Patient Details</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Age" 
                  value={newPrescription.clinicInfo?.patientDetails.age?.toString()} 
                  onChangeText={handlePatientAgeChange}
                  keyboardType="numeric"
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Gender" 
                  value={newPrescription.clinicInfo?.patientDetails.gender} 
                  onChangeText={handlePatientGenderChange} 
                />
                <TextInput 
                  style={[styles.input, styles.notesInput]} 
                  placeholder="Allergies (one per line)" 
                  value={newPrescription.clinicInfo?.patientDetails.allergies?.join('\n')} 
                  onChangeText={handleAllergiesChange}
                  multiline
                  numberOfLines={4}
                />
                <TextInput 
                  style={[styles.input, styles.notesInput]} 
                  placeholder="Medical History (one per line)" 
                  value={newPrescription.clinicInfo?.patientDetails.medicalHistory?.join('\n')} 
                  onChangeText={handleMedicalHistoryChange}
                  multiline
                  numberOfLines={4}
                />
              </>
            )}

            <Text style={styles.sectionTitle}>Doctor Information</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Doctor Name" 
              value={newPrescription.doctorName} 
              onChangeText={text => setNewPrescription({ ...newPrescription, doctorName: text })} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Department" 
              value={newPrescription.doctorDepartment} 
              onChangeText={text => setNewPrescription({ ...newPrescription, doctorDepartment: text })} 
            />

            <Text style={styles.sectionTitle}>Prescription Details</Text>
            <TouchableOpacity style={styles.input} onPress={showDatePicker}>
              <Text>{newPrescription.date.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Medication</Text>
            {newPrescription.medications.map((medication, index) => (
              <View key={index} style={styles.medicationContainer}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationTitle}>Medication {index + 1}</Text>
                  {newPrescription.medications.length > 1 && (
                    <TouchableOpacity 
                      style={styles.deleteMedicationButton}
                      onPress={() => {
                        const updatedMedications = newPrescription.medications.filter((_, i) => i !== index);
                        setNewPrescription({
                          ...newPrescription,
                          medications: updatedMedications
                        });
                      }}
                    >
                      <Trash2 size={20} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Drug Name" 
                  value={medication.drugName} 
                  onChangeText={text => {
                    const updatedMedications = [...newPrescription.medications];
                    updatedMedications[index] = { ...medication, drugName: text };
                    setNewPrescription({ ...newPrescription, medications: updatedMedications });
                  }} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Dosage (e.g., 500 mg/m²)" 
                  value={medication.dosage} 
                  onChangeText={text => {
                    const updatedMedications = [...newPrescription.medications];
                    updatedMedications[index] = { ...medication, dosage: text };
                    setNewPrescription({ ...newPrescription, medications: updatedMedications });
                  }} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Frequency" 
                  value={medication.frequency} 
                  onChangeText={text => {
                    const updatedMedications = [...newPrescription.medications];
                    updatedMedications[index] = { ...medication, frequency: text };
                    setNewPrescription({ ...newPrescription, medications: updatedMedications });
                  }} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Duration" 
                  value={medication.duration} 
                  onChangeText={text => {
                    const updatedMedications = [...newPrescription.medications];
                    updatedMedications[index] = { ...medication, duration: text };
                    setNewPrescription({ ...newPrescription, medications: updatedMedications });
                  }} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Quantity" 
                  value={medication.quantity.toString()} 
                  onChangeText={text => {
                    const updatedMedications = [...newPrescription.medications];
                    updatedMedications[index] = { ...medication, quantity: parseInt(text) || 1 };
                    setNewPrescription({ ...newPrescription, medications: updatedMedications });
                  }} 
                  keyboardType="numeric"
                />
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addMedicationButton} 
              onPress={() => {
                setNewPrescription({
                  ...newPrescription,
                  medications: [
                    ...newPrescription.medications,
                    {
                      drugName: '',
                      dosage: '',
                      frequency: '',
                      duration: '',
                      quantity: 1,
                      stockAvailable: 0,
                      isNearExpiry: false,
                      isLowStock: false
                    }
                  ]
                });
              }}
            >
              <Plus size={20} color={Colors.white} />
              <Text style={styles.addMedicationButtonText}>Add Another Medication</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput 
              style={[styles.input, styles.notesInput]} 
              placeholder="Add pharmacist notes..." 
              value={newPrescription.pharmacistNotes} 
              onChangeText={text => setNewPrescription({ ...newPrescription, pharmacistNotes: text })} 
              multiline
              numberOfLines={4}
            />

            <View style={styles.statusContainer}>
              {['pending', 'filled', 'rejected', 'partially_filled'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, newPrescription.status === status && styles.activeStatusButton]}
                  onPress={() => setNewPrescription({ ...newPrescription, status: status as any })}
                >
                  <Text style={[styles.statusButtonText, newPrescription.status === status && { color: Colors.white }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Save" variant="primary" onPress={handleAddPrescription} style={styles.saveButton} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        title="Prescriptions"
        rightComponent={
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon={<RefreshCw size={22} color={Colors.gray[700]} />}
              onPress={syncPrescriptions}
              variant="ghost"
              size="medium"
              disabled={isSyncing}
            />
            <IconButton
              icon={<Filter size={22} color={Colors.gray[700]} />}
              onPress={() => setShowFilters(true)}
              variant="ghost"
              size="medium"
            />
            <IconButton
              icon={<Camera size={22} color={Colors.gray[700]} />}
              onPress={() => console.log('Open camera')}
              variant="ghost"
              size="medium"
            />
          </View>
        }
      />

      <View style={styles.content}>
        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'pharmacy' && styles.activeSectionTab]}
            onPress={() => setActiveSection('pharmacy')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'pharmacy' && styles.activeSectionTabText]}>
              Pharmacy Patients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'clinic' && styles.activeSectionTab]}
            onPress={() => setActiveSection('clinic')}
          >
            <Text style={[styles.sectionTabText, activeSection === 'clinic' && styles.activeSectionTabText]}>
              Clinic Referrals
            </Text>
          </TouchableOpacity>
        </View>

        {(syncError || isSyncing) && (
          <View style={styles.errorContainer}>
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <AlertCircle size={20} color={Colors.danger} />
            )}
            <Text style={styles.errorText}>{isSyncing ? 'Syncing prescriptions...' : syncError}</Text>
            {!isSyncing && syncError && (
              <Button title="Retry" variant="outline" onPress={syncPrescriptions} size="small" style={styles.retryButton} />
            )}
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeSection === 'pharmacy' ? 'pharmacy' : 'clinic'} prescriptions...`}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.gray[400]}
            />
            {searchQuery && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Filter size={20} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterTabs}>
          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterTabsContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterTab, activeFilter === item.key && styles.activeFilterTab]}
                onPress={() => filterPrescriptions(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === item.key && styles.activeFilterTabText
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {activeSection === 'pharmacy' ? (
          <FlatList
            data={prescriptions.filter(p => !p.isClinicReferral)}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.prescriptionsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={prescriptions.filter(p => p.isClinicReferral)}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.prescriptionsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            setNewPrescription(prev => ({
              ...prev,
              isClinicReferral: activeSection === 'clinic'
            }));
            setIsAddModalVisible(true);
          }}
        >
          <Plus size={24} color={Colors.white} />
        </TouchableOpacity>

        {renderPatientModal()}
        {renderAddModal()}
        {renderFilterModal()}
        {renderSubstitutionModal()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.danger}15`,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.danger,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[800],
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  filterTabs: {
    marginBottom: 16,
    marginTop: 8,
    minHeight: 48,
  },
  filterTabsContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.10,
  },
  filterTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.gray[700],
    textAlign: 'center',
    maxWidth: 100,
  },
  activeFilterTabText: {
    color: Colors.white,
  },
  prescriptionsList: {
    paddingBottom: 80,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.gray[800],
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 32,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[800],
  },
  dosagePreview: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 12,
    padding: 8,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginHorizontal: 4,
    marginVertical: 4,
    alignItems: 'center',
    minWidth: '30%',
  },
  activeStatusButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
  },
  saveButton: {
    marginTop: 16,
  },
  retryButton: {
    marginLeft: 8,
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.gray[800],
  },
  filterModalBody: {
    maxHeight: '80%',
  },
  filterLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  filterInput: {
    backgroundColor: Colors.gray[100],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  applyFilterButton: {
    marginTop: 16,
  },
  substitutionModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  substitutionModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  substitutionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  substitutionModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.gray[800],
  },
  substitutionModalBody: {
    maxHeight: '80%',
  },
  substitutionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  substitutionValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[800],
    marginBottom: 16,
  },
  substitutionInput: {
    backgroundColor: Colors.gray[100],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  substitutionTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmSubstitutionButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[800],
    marginTop: 16,
    marginBottom: 8,
  },
  medicationContainer: {
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addMedicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addMedicationButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
    marginLeft: 8,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[700],
  },
  deleteMedicationButton: {
    padding: 4,
  },
  patientModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  patientModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.gray[800],
  },
  patientModalBody: {
    maxHeight: '80%',
  },
  patientInfoSection: {
    marginBottom: 16,
  },
  patientInfoLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  patientInfoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[800],
    marginBottom: 2,
  },
  sectionTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSectionTab: {
    backgroundColor: Colors.primary,
  },
  sectionTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
  },
  activeSectionTabText: {
    color: Colors.white,
  },
});