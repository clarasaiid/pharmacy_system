import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, Wallet, FileText, DollarSign, Shield, AlertTriangle, ChevronDown, Search, Plus, Minus, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  price: number;
  isControlled: boolean;
  quantity: number;
  unitType?: 'box' | 'strip';
}

const availableDrugs: Prescription[] = [
  { id: 'rx1', drugName: 'Atorvastatin', dosage: '40mg', price: 25.99, isControlled: false, quantity: 1 },
  { id: 'rx2', drugName: 'Lisinopril', dosage: '10mg', price: 12.50, isControlled: false, quantity: 1 },
  { id: 'rx3', drugName: 'Oxycodone', dosage: '5mg', price: 65.00, isControlled: true, quantity: 1 },
  { id: 'rx4', drugName: 'Metformin', dosage: '500mg', price: 8.99, isControlled: false, quantity: 1 },
  { id: 'rx5', drugName: 'Amoxicillin', dosage: '250mg', price: 15.75, isControlled: false, quantity: 1 },
  { id: 'rx6', drugName: 'Omeprazole', dosage: '20mg', price: 18.50, isControlled: false, quantity: 1 }
];

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: <CreditCard size={24} color={Colors.primary} />,
    description: 'Pay with Visa, Mastercard, or other major cards'
  },
  {
    id: 'wallet',
    name: 'Mobile Wallet',
    icon: <Wallet size={24} color={Colors.primary} />,
    description: 'Pay with Apple Pay or Google Pay'
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: <Shield size={24} color={Colors.primary} />,
    description: 'Submit insurance claim for coverage'
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: <DollarSign size={24} color={Colors.primary} />,
    description: 'Pay with cash at counter'
  }
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [insuranceVerified, setInsuranceVerified] = useState(false);
  const [splitAmount, setSplitAmount] = useState({
    insurance: 0,
    patient: 0
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Prescription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuantities, setSelectedQuantities] = useState<{[key: string]: number}>({});
  const [selectedDrugs, setSelectedDrugs] = useState<{ [key: string]: SelectedDrug }>({});

  const totalAmount = prescriptions.reduce((sum, rx) => sum + (rx.price * rx.quantity), 0);
  const hasControlledSubstances = prescriptions.some(rx => rx.isControlled);

  // Filter drugs based on search query
  const filteredDrugs = useMemo(() => {
    return availableDrugs.filter(drug => 
      drug.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.dosage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleInsuranceVerification = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInsuranceVerified(true);
      setSplitAmount({
        insurance: Math.round(totalAmount * 0.75),
        patient: Math.round(totalAmount * 0.25)
      });
    } catch (error) {
      console.error('Insurance verification failed:', error);
    }
  };

  const toggleDrugSelection = (drug: Prescription) => {
    setSelectedDrugs(prev => {
      const newSelected = { ...prev };
      if (newSelected[drug.id]) {
        delete newSelected[drug.id];
      } else {
        newSelected[drug.id] = {
          drug,
          quantity: 1,
          unitType: 'box',
        };
      }
      return newSelected;
    });
  };

  const updateSelectedQuantity = (drugId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedDrugs(prev => ({
      ...prev,
      [drugId]: {
        ...prev[drugId],
        quantity: newQuantity
      }
    }));
  };

  const addSelectedDrugs = () => {
    const newPrescriptions = Object.values(selectedDrugs).map(({ drug, quantity, unitType }) => ({
      ...drug,
      quantity,
      unitType,
    }));
    setPrescriptions(prev => [...prev, ...newPrescriptions]);
    setSelectedDrugs({});
    setIsDropdownVisible(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header title="Payment Processing" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Prescription List */}
        <Card style={styles.section} title="Add Prescriptions">
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setIsDropdownVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              Select medications ({Object.keys(selectedDrugs).length} selected)
            </Text>
            <ChevronDown size={20} color={Colors.gray[600]} />
          </TouchableOpacity>

          <Modal
            visible={isDropdownVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsDropdownVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Medications</Text>
                  <TouchableOpacity onPress={() => setIsDropdownVisible(false)}>
                    <Text style={styles.closeButton}>Close</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchContainer}>
                  <Search size={20} color={Colors.gray[500]} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search medications..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={Colors.gray[500]}
                  />
                </View>

                <ScrollView style={styles.drugList}>
                  {filteredDrugs.map((drug) => (
                    <View key={drug.id} style={styles.drugItem}>
                      <TouchableOpacity
                        style={styles.drugInfo}
                        onPress={() => toggleDrugSelection(drug)}
                      >
                        <View style={styles.checkboxContainer}>
                          <View style={[
                            styles.checkbox,
                            selectedDrugs[drug.id] && styles.checkboxSelected
                          ]}>
                            {selectedDrugs[drug.id] && (
                              <Check size={16} color={Colors.white} />
                            )}
                          </View>
                        </View>
                        <View style={styles.drugDetails}>
                          <Text style={styles.drugName}>{drug.drugName}</Text>
                          <Text style={styles.drugDosage}>{drug.dosage}</Text>
                          {drug.isControlled && (
                            <View style={styles.controlledBadge}>
                              <AlertTriangle size={12} color={Colors.danger} />
                              <Text style={styles.controlledText}>CONTROLLED</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      {selectedDrugs[drug.id] && (
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateSelectedQuantity(drug.id, selectedDrugs[drug.id].quantity - 1)}
                          >
                            <Minus size={16} color={Colors.gray[700]} />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>
                            {selectedDrugs[drug.id].quantity}
                          </Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateSelectedQuantity(drug.id, selectedDrugs[drug.id].quantity + 1)}
                          >
                            <Plus size={16} color={Colors.gray[700]} />
                          </TouchableOpacity>
                          <Text style={styles.drugPrice}>
                            LE {(drug.price * selectedDrugs[drug.id].quantity).toFixed(2)}
                          </Text>
                        </View>
                      )}
                      {selectedDrugs[drug.id] && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <TouchableOpacity
                            style={[
                              styles.unitTypeButton,
                              selectedDrugs[drug.id].unitType === 'box' && styles.unitTypeButtonSelected,
                            ]}
                            onPress={() =>
                              setSelectedDrugs((prev) => ({
                                ...prev,
                                [drug.id]: { ...prev[drug.id], unitType: 'box' },
                              }))
                            }
                          >
                            <Text style={styles.unitTypeText}>Box</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.unitTypeButton,
                              selectedDrugs[drug.id].unitType === 'strip' && styles.unitTypeButtonSelected,
                            ]}
                            onPress={() =>
                              setSelectedDrugs((prev) => ({
                                ...prev,
                                [drug.id]: { ...prev[drug.id], unitType: 'strip' },
                              }))
                            }
                          >
                            <Text style={styles.unitTypeText}>Strip</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Text style={styles.selectedCount}>
                    {Object.keys(selectedDrugs).length} medications selected
                  </Text>
                  <Button
                    title="Add Selected"
                    onPress={addSelectedDrugs}
                    variant="primary"
                    disabled={Object.keys(selectedDrugs).length === 0}
                  />
                </View>
              </View>
            </View>
          </Modal>

          {/* Selected Prescriptions */}
          {prescriptions.map((rx) => (
            <View key={rx.id} style={styles.rxItem}>
              <View style={styles.rxInfo}>
                <Text style={styles.rxName}>{rx.drugName}</Text>
                <Text style={styles.rxDosage}>{rx.dosage}</Text>
                {rx.unitType && (
                  <Text style={styles.unitTypeLabel}>{rx.unitType === 'box' ? 'Box' : 'Strip'}</Text>
                )}
                {rx.isControlled && (
                  <View style={styles.controlledBadge}>
                    <AlertTriangle size={12} color={Colors.danger} />
                    <Text style={styles.controlledText}>CONTROLLED</Text>
                  </View>
                )}
              </View>
              <View style={styles.rxActions}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateSelectedQuantity(rx.id, rx.quantity - 1)}
                  >
                    <Minus size={16} color={Colors.gray[700]} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{rx.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateSelectedQuantity(rx.id, rx.quantity + 1)}
                  >
                    <Plus size={16} color={Colors.gray[700]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.rxPrice}>LE {(rx.price * rx.quantity).toFixed(2)}</Text>
                <TouchableOpacity 
                  onPress={() => updateSelectedQuantity(rx.id, 0)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {prescriptions.length > 0 && (
            <View style={[styles.summaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.gray[200], paddingTop: 8 }]}>
              <Text style={[styles.summaryLabel, { fontFamily: 'Inter-Bold' }]}>Subtotal:</Text>
              <Text style={[styles.summaryAmount, { fontFamily: 'Inter-Bold' }]}>LE {totalAmount.toFixed(2)}</Text>
            </View>
          )}
        </Card>

        {/* Payment Methods Section */}
        <Card style={styles.section} title="Select Payment Method">
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedMethod === method.id && styles.selectedMethod
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodIcon}>{method.icon}</View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Insurance Verification Section */}
        {selectedMethod === 'insurance' && (
          <Card style={styles.section} title="Insurance Verification">
            {!insuranceVerified ? (
              <View style={styles.insuranceSection}>
                <Text style={styles.insuranceText}>
                  Verify insurance coverage and eligibility
                </Text>
                <Button
                  title="Verify Insurance"
                  onPress={handleInsuranceVerification}
                  variant="primary"
                  style={styles.verifyButton}
                />
              </View>
            ) : (
              <View style={styles.splitBilling}>
                <Text style={styles.splitTitle}>Coverage Split</Text>
                <View style={styles.splitRow}>
                  <Text style={styles.splitLabel}>Insurance Coverage:</Text>
                  <Text style={styles.splitAmount}>LE {splitAmount.insurance.toFixed(2)}</Text>
                </View>
                <View style={styles.splitRow}>
                  <Text style={styles.splitLabel}>Patient Responsibility:</Text>
                  <Text style={styles.splitAmount}>LE {splitAmount.patient.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Payment Summary */}
        <Card style={styles.section} title="Payment Summary">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryAmount}>LE {totalAmount.toFixed(2)}</Text>
          </View>
          {selectedMethod === 'insurance' && insuranceVerified && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient Portion:</Text>
              <Text style={styles.summaryAmount}>LE {splitAmount.patient.toFixed(2)}</Text>
            </View>
          )}
        </Card>

        {/* Invoice Display Section */}
        {prescriptions.length > 0 && (
          <Card style={styles.section} title="Invoice">
            <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.gray[200], paddingBottom: 4, marginBottom: 4, flexDirection: 'row' }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 13 }}>Medicine</Text>
              <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Qty</Text>
              <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 13, textAlign: 'right' }}>Price</Text>
              <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 13, textAlign: 'right' }}>Total</Text>
            </View>
            {prescriptions.map((rx, idx) => (
              <View key={rx.id} style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ flex: 2, fontSize: 12 }}>{rx.drugName} {rx.dosage}</Text>
                <Text style={{ flex: 1, fontSize: 12, textAlign: 'center' }}>{rx.quantity}</Text>
                <Text style={{ flex: 1, fontSize: 12, textAlign: 'right' }}>LE {rx.price.toFixed(2)}</Text>
                <Text style={{ flex: 1, fontSize: 12, textAlign: 'right' }}>LE {(rx.price * rx.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: Colors.gray[200], marginTop: 6, paddingTop: 4, flexDirection: 'row' }}>
              <Text style={{ flex: 2 }}></Text>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 13, textAlign: 'right' }}>Total: LE {totalAmount.toFixed(2)}</Text>
            </View>
            <Button
              title="Print Invoice"
              onPress={() => { if (typeof window !== 'undefined' && window.print) window.print(); }}
              variant="outline"
              style={{ marginTop: 10, alignSelf: 'flex-end' }}
            />
          </Card>
        )}

        {/* Process Payment Button */}
        <Button
          title="Process Payment"
          onPress={() => {}}
          variant="primary"
          style={styles.processButton}
          disabled={!selectedMethod || (selectedMethod === 'insurance' && !insuranceVerified)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  methodIcon: {
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  methodDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  insuranceSection: {
    padding: 16,
  },
  insuranceText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 16,
  },
  verifyButton: {
    alignSelf: 'flex-start',
  },
  splitBilling: {
    padding: 16,
  },
  splitTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  splitLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  splitAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[900],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  summaryAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[900],
  },
  processButton: {
    marginTop: 8,
  },
  rxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 8,
    marginBottom: 8,
  },
  rxInfo: {
    flex: 1,
  },
  rxName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  rxDosage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  rxPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[900],
  },
  controlledBadge: {
    backgroundColor: Colors.danger + '10',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 4,
    padding: 4,
    marginLeft: 8,
  },
  controlledText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    marginBottom: 12,
  },
  dropdownButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.gray[900],
  },
  closeButton: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primary,
  },
  drugList: {
    padding: 16,
  },
  drugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  drugInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drugName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
  },
  drugDosage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  drugPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[900],
  },
  rxActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  quantityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.gray[900],
    minWidth: 24,
    textAlign: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  drugDetails: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  unitTypeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginRight: 8,
    backgroundColor: Colors.gray[100],
  },
  unitTypeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitTypeText: {
    color: Colors.gray[800],
    fontWeight: 'bold',
  },
  unitTypeLabel: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
}); 