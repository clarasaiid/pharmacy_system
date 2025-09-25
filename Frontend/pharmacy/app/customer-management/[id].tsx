import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Edit, Phone, Mail, MapPin, CreditCard, Clock, Star, MessageSquare } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/ui/Header';

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  startDate: string;
  endDate: string;
  refillsRemaining: number;
  status: 'active' | 'completed' | 'expired';
}

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    medication: 'Lisinopril 10mg',
    dosage: '1 tablet daily',
    startDate: '2024-02-01',
    endDate: '2024-08-01',
    refillsRemaining: 2,
    status: 'active',
  },
  {
    id: '2',
    medication: 'Metformin 500mg',
    dosage: '1 tablet twice daily',
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    refillsRemaining: 0,
    status: 'completed',
  },
];

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'prescriptions' | 'loyalty'>('details');

  // Mock customer data - in a real app, this would come from an API
  const customer = {
    id,
    name: 'Ahmed Mohamed',
    phone: '+1 234 567 8900',
    email: 'ahmed.mohamed@email.com',
    address: '123 Main St, City, State 12345',
    insurance: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP987654',
    },
    loyaltyPoints: 250,
    memberSince: '2023-01-15',
  };

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Phone size={20} color={Colors.gray[600]} />
          <Text style={styles.infoText}>{customer.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Mail size={20} color={Colors.gray[600]} />
          <Text style={styles.infoText}>{customer.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gray[600]} />
          <Text style={styles.infoText}>{customer.address}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <CreditCard size={20} color={Colors.gray[600]} />
            <View>
              <Text style={styles.infoLabel}>Provider</Text>
              <Text style={styles.infoText}>{customer.insurance.provider}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Policy Number</Text>
            <Text style={styles.infoText}>{customer.insurance.policyNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Group Number</Text>
            <Text style={styles.infoText}>{customer.insurance.groupNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Clock size={20} color={Colors.gray[600]} />
            <View>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoText}>{customer.memberSince}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Star size={20} color={Colors.gray[600]} />
            <View>
              <Text style={styles.infoLabel}>Loyalty Points</Text>
              <Text style={styles.infoText}>{customer.loyaltyPoints} points</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPrescriptionsTab = () => (
    <View style={styles.tabContent}>
      {mockPrescriptions.map((prescription) => (
        <View key={prescription.id} style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <Text style={styles.medicationName}>{prescription.medication}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: prescription.status === 'active' ? Colors.success : Colors.gray[300] }
            ]}>
              <Text style={styles.statusText}>{prescription.status}</Text>
            </View>
          </View>
          <Text style={styles.dosage}>{prescription.dosage}</Text>
          <View style={styles.prescriptionDetails}>
            <Text style={styles.detailText}>Start: {prescription.startDate}</Text>
            <Text style={styles.detailText}>End: {prescription.endDate}</Text>
            <Text style={styles.detailText}>Refills: {prescription.refillsRemaining}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderLoyaltyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.loyaltyCard}>
        <Text style={styles.loyaltyPoints}>{customer.loyaltyPoints}</Text>
        <Text style={styles.loyaltyLabel}>Total Points</Text>
        <View style={styles.loyaltyProgress}>
          <View style={[styles.progressBar, { width: '75%' }]} />
        </View>
        <Text style={styles.nextReward}>500 points until next reward</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Text style={styles.activityDate}>2024-03-15</Text>
            <Text style={styles.activityText}>+50 points for prescription refill</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityDate}>2024-03-01</Text>
            <Text style={styles.activityText}>+100 points for new prescription</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Customer Details"
        rightComponent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/customer-management/${id}/edit`)}
          >
            <Edit size={24} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.profileHeader}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <TouchableOpacity style={styles.messageButton}>
          <MessageSquare size={20} color={Colors.white} />
          <Text style={styles.messageButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
          onPress={() => setActiveTab('prescriptions')}
        >
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>
            Prescriptions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loyalty' && styles.activeTab]}
          onPress={() => setActiveTab('loyalty')}
        >
          <Text style={[styles.tabText, activeTab === 'loyalty' && styles.activeTabText]}>
            Loyalty
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'prescriptions' && renderPrescriptionsTab()}
        {activeTab === 'loyalty' && renderLoyaltyTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  profileHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  customerName: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
    marginBottom: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  messageButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[800],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
    marginBottom: 12,
  },
  prescriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  dosage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 8,
  },
  prescriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  loyaltyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  loyaltyPoints: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  loyaltyLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginBottom: 16,
  },
  loyaltyProgress: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  nextReward: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  activityList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  activityDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[800],
  },
  editButton: {
    padding: 8,
  },
}); 