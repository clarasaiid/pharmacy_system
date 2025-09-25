import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, User, Calendar, CircleCheck as CheckCircle, Clock, Circle as XCircle, Edit, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Alert } from 'react-native';

export interface Prescription {
  id: string;
  patientName: string;
  patientId?: string;
  patientImage?: string;
  doctorName: string;
  doctorDepartment?: string;
  date: Date;
  status: 'pending' | 'filled' | 'rejected' | 'partially_filled' | 'processing' | 'completed' | 'dispensed' | 'onHold' | 'awaitingConfirmation';
  items: number;
  imageUrl?: string;
  isClinicReferral?: boolean;
  clinicInfo?: {
    clinicName: string;
    clinicId: string;
    referralDate: Date;
    diagnosis: string;
    patientDetails: {
      age: number;
      gender: string;
      allergies: string[];
      medicalHistory: string[];
      lastVisit?: Date;
    };
  };
  medications: {
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    stockAvailable: number;
    expiryDate?: Date;
    isNearExpiry?: boolean;
    isLowStock?: boolean;
    substitution?: {
      originalDrug: string;
      substitutedDrug: string;
      reason: string;
    };
  }[];
  auditLog: {
    timestamp: Date;
    action: string;
    userId: string;
    userRole: string;
    notes?: string;
  }[];
  pharmacistNotes?: string;
  lastUpdated?: { timestamp: Date; pharmacistId: string };
  ocrResult?: string;
  attachments?: {
    type: 'image' | 'pdf';
    url: string;
    name: string;
  }[];
  isEditable?: boolean;
}

export interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: (prescription: Prescription) => void;
  onUpdateStatus: (id: string, status: Prescription['status'], notes?: string) => Promise<void>;
  onScanComplete: (prescriptionId: string, imageUrl: string, ocrResult: string) => void;
  isUpdating: boolean;
  onPatientPress: () => void;
}

export default function PrescriptionCard({ 
  prescription, 
  onPress, 
  onUpdateStatus, 
  onScanComplete,
  isUpdating,
  onPatientPress
}: PrescriptionCardProps) {
  const [notes, setNotes] = useState(prescription.pharmacistNotes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  const getStatusColor = () => {
    switch (prescription.status) {
      case 'pending': return Colors.warning;
      case 'filled': return Colors.success;
      case 'rejected': return Colors.danger;
      case 'partially_filled': return Colors.warning;
      case 'processing': return Colors.primary;
      case 'completed': return Colors.success;
      case 'dispensed': return Colors.success;
      case 'onHold': return Colors.warning;
      case 'awaitingConfirmation': return Colors.gray[500];
      default: return Colors.gray[500];
    }
  };

  const getStatusText = () => {
    switch (prescription.status) {
      case 'pending': return 'Pending';
      case 'filled': return 'Filled';
      case 'rejected': return 'Rejected';
      case 'partially_filled': return 'Partially Filled';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'dispensed': return 'Dispensed';
      case 'onHold': return 'On Hold';
      case 'awaitingConfirmation': return 'Awaiting Confirmation';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (prescription.status) {
      case 'pending': return <Clock size={16} color={getStatusColor()} />;
      case 'processing': return <Clock size={16} color={getStatusColor()} />;
      case 'completed': return <CheckCircle size={16} color={getStatusColor()} />;
      case 'rejected': return <XCircle size={16} color={getStatusColor()} />;
      case 'dispensed': return <CheckCircle size={16} color={getStatusColor()} />;
      case 'onHold': return <Clock size={16} color={getStatusColor()} />;
      case 'awaitingConfirmation': return <Clock size={16} color={getStatusColor()} />;
      default: return <Clock size={16} color={getStatusColor()} />;
    }
  };

  const checkDosageWarning = () => {
    const dosageValue = parseFloat(prescription.medications[0].dosage);
    if (!isNaN(dosageValue) && dosageValue > 1000) { // Arbitrary threshold for oncology drugs
      return true;
    }
    return false;
  };

  const handleStatusUpdate = (newStatus: Prescription['status']) => {
    Alert.alert(
      'Confirm Status Update',
      `Are you sure you want to change the status to "${getStatusText()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            if (onUpdateStatus) {
              onUpdateStatus(prescription.id, newStatus, notes);
              setIsEditing(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveNotes = () => {
    if (onUpdateStatus) {
      onUpdateStatus(prescription.id, prescription.status, notes);
      setIsEditing(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isEditing && styles.containerActive]}
      onPress={() => onPress(prescription)}
      activeOpacity={0.7}
      accessibilityLabel={`Prescription for ${prescription.patientName}, status: ${getStatusText()}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.patientInfo}>
            <TouchableOpacity 
              style={styles.patientNameContainer} 
              onPress={onPatientPress}
              activeOpacity={0.7}
            >
              <User size={16} color={Colors.gray[600]} />
              <Text style={styles.patientName} accessibilityLabel={`Patient name: ${prescription.patientName}`}>
                {prescription.patientName}
              </Text>
            </TouchableOpacity>
            <View style={styles.prescriptionIdContainer}>
              <FileText size={12} color={Colors.gray[500]} />
              <Text style={styles.prescriptionId} accessibilityLabel={`Prescription ID: ${prescription.id}`}>
                #{prescription.id}
              </Text>
            </View>
            <Text style={styles.detailText}>Drug: {prescription.medications[0].drugName}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Dosage: {prescription.medications[0].dosage}</Text>
              {checkDosageWarning() && (
                <AlertTriangle size={14} color={Colors.danger} style={styles.warningIcon} />
              )}
            </View>
            <Text style={styles.detailText}>Frequency: {prescription.medications[0].frequency}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={getStatusColor()} />
          ) : (
            getStatusIcon()
          )}
          <Text style={[styles.statusText, { color: getStatusColor() }]} accessibilityLabel={`Status: ${getStatusText()}`}>
            {getStatusText()}
          </Text>
          <TouchableOpacity onPress={() => setIsEditing(true)} accessibilityLabel="Edit prescription status">
            <Edit size={16} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <User size={14} color={Colors.gray[500]} />
          <Text style={styles.detailText} accessibilityLabel={`Doctor: ${prescription.doctorName}`}>
            {prescription.doctorName}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={14} color={Colors.gray[500]} />
          <Text style={styles.detailText} accessibilityLabel={`Date: ${format(prescription.date, 'MMM dd, yyyy')}`}>
            {format(prescription.date, 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>

      {prescription.imageUrl && (
        <View style={styles.imagePreviewContainer}>
          {isImageError ? (
            <View style={styles.imageError}>
              <Text style={styles.imageErrorText}>Failed to load image</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: prescription.imageUrl }} 
              style={styles.prescriptionImage} 
              resizeMode="cover"
              onError={() => setIsImageError(true)}
              accessibilityLabel="Prescription image"
            />
          )}
        </View>
      )}

      {prescription.lastUpdated && (
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last Updated: {format(prescription.lastUpdated.timestamp, 'MMM dd, yyyy HH:mm')} by Pharmacist #{prescription.lastUpdated.pharmacistId}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {prescription.items} {prescription.items === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {prescription.pharmacistNotes && !isEditing && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Pharmacist Notes:</Text>
          <Text style={styles.notesText}>{prescription.pharmacistNotes}</Text>
        </View>
      )}

      {isEditing && (
        <View style={styles.editContainer}>
          <Text style={styles.notesLabel}>Pharmacist Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            accessibilityLabel="Pharmacist notes input"
          />
          <View style={styles.statusButtons}>
            {['pending', 'processing', 'completed', 'rejected', 'dispensed', 'onHold', 'awaitingConfirmation'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.statusButton, prescription.status === status && styles.activeStatusButton]}
                onPress={() => handleStatusUpdate(status as Prescription['status'])}
                accessibilityLabel={`Set status to ${status}`}
              >
                <Text style={[styles.statusButtonText, prescription.status === status && { color: Colors.white }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveNotesButton} onPress={handleSaveNotes} accessibilityLabel="Save pharmacist notes">
            <Text style={styles.saveNotesButtonText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerActive: {
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientInfo: {
    flex: 1,
  },
  patientNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  patientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[800],
    marginBottom: 4,
  },
  prescriptionIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prescriptionId: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
    marginLeft: 4,
    marginBottom: 4,
  },
  imagePreviewContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  prescriptionImage: {
    width: '100%',
    height: '100%',
  },
  imageError: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  lastUpdated: {
    marginBottom: 12,
  },
  lastUpdatedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.gray[500],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  itemCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
  },
  notesContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  notesLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  editContainer: {
    marginTop: 12,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    marginBottom: 12,
    minHeight: 60,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginHorizontal: 4,
    marginBottom: 8,
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
  saveNotesButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  saveNotesButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
});