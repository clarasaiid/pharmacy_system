import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Minus, Search, ChevronDown, Printer, Save, X, Check, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  deliveryTerms: string;
}

interface Drug {
  id: string;
  name: string;
  sku: string;
  form: string;
  strength: string;
  currentStock: number;
  minThreshold: number;
}

interface OrderItem {
  id: string;
  drug: Drug;
  quantity: number;
  notes: string;
}

const suppliers: Supplier[] = [
  { id: 'sup1', name: 'MediSupply Co.', contact: '+1-555-0123', deliveryTerms: 'Next day delivery' },
  { id: 'sup2', name: 'PharmaDist Inc.', contact: '+1-555-0124', deliveryTerms: '2-3 business days' },
  { id: 'sup3', name: 'Global Meds Ltd.', contact: '+1-555-0125', deliveryTerms: '3-5 business days' },
];

const availableDrugs: Drug[] = [
  { id: 'drug1', name: 'Atorvastatin', sku: 'ATV-40', form: 'Tablet', strength: '40mg', currentStock: 150, minThreshold: 100 },
  { id: 'drug2', name: 'Lisinopril', sku: 'LIS-10', form: 'Tablet', strength: '10mg', currentStock: 80, minThreshold: 50 },
  { id: 'drug3', name: 'Metformin', sku: 'MET-500', form: 'Tablet', strength: '500mg', currentStock: 200, minThreshold: 75 },
  { id: 'drug4', name: 'Amoxicillin', sku: 'AMX-250', form: 'Capsule', strength: '250mg', currentStock: 120, minThreshold: 50 },
];

export default function SupplierOrderScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalVisible, setIsSupplierModalVisible] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDrugModalVisible, setIsDrugModalVisible] = useState(false);
  const [drugSearchQuery, setDrugSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
      supplier.contact.includes(supplierSearchQuery)
    );
  }, [supplierSearchQuery]);

  const filteredDrugs = useMemo(() => {
    return availableDrugs.filter(drug =>
      drug.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
      drug.sku.toLowerCase().includes(drugSearchQuery.toLowerCase())
    );
  }, [drugSearchQuery]);

  const addOrderItem = () => {
    if (!selectedDrug) return;
    
    setOrderItems(prev => [...prev, {
      id: Date.now().toString(),
      drug: selectedDrug,
      quantity,
      notes
    }]);
    
    setSelectedDrug(null);
    setQuantity(1);
    setNotes('');
    setIsDrugModalVisible(false);
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const submitOrder = () => {
    if (!selectedSupplier) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }
    if (orderItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the order');
      return;
    }
    
    // Here you would typically make an API call to submit the order
    Alert.alert('Success', 'Order submitted successfully');
  };

  const saveDraft = () => {
    // Here you would typically save the order as a draft
    Alert.alert('Success', 'Order saved as draft');
  };

  const printOrder = () => {
    // Here you would typically generate and print a PDF
    Alert.alert('Success', 'Order printed successfully');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header title="New Supplier Order" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Supplier Information */}
        <Card style={styles.section} title="Supplier Information">
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setIsSupplierModalVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
            </Text>
            <ChevronDown size={20} color={Colors.gray[600]} />
          </TouchableOpacity>

          {selectedSupplier && (
            <View style={styles.supplierInfo}>
              <Text style={styles.supplierContact}>Contact: {selectedSupplier.contact}</Text>
              <Text style={styles.supplierTerms}>Delivery Terms: {selectedSupplier.deliveryTerms}</Text>
            </View>
          )}
        </Card>

        {/* Order Items */}
        <Card style={styles.section} title="Order Items">
          {orderItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.drug.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.drug.form} • {item.drug.strength} • SKU: {item.drug.sku}
                </Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                {item.notes && <Text style={styles.itemNotes}>Notes: {item.notes}</Text>}
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeOrderItem(item.id)}
              >
                <X size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <Button
            title="Add Item"
            onPress={() => setIsDrugModalVisible(true)}
            variant="secondary"
            icon={<Plus size={20} color={Colors.primary} />}
            style={styles.addButton}
          />
        </Card>

        {/* Order Notes */}
        <Card style={styles.section} title="Order Notes">
          <TextInput
            style={styles.notesInput}
            placeholder="Add delivery instructions, urgent requests, or substitution approvals..."
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Order Actions */}
        <View style={styles.actions}>
          <Button
            title="Submit Order"
            onPress={submitOrder}
            variant="primary"
            icon={<Check size={20} color={Colors.white} />}
            style={styles.actionButton}
          />
          <Button
            title="Save Draft"
            onPress={saveDraft}
            variant="secondary"
            icon={<Save size={20} color={Colors.primary} />}
            style={styles.actionButton}
          />
          <Button
            title="Print Order"
            onPress={printOrder}
            variant="secondary"
            icon={<Printer size={20} color={Colors.primary} />}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Supplier Selection Modal */}
      <Modal
        visible={isSupplierModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSupplierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setIsSupplierModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search suppliers..."
                value={supplierSearchQuery}
                onChangeText={setSupplierSearchQuery}
                placeholderTextColor={Colors.gray[500]}
              />
            </View>

            <ScrollView style={styles.supplierList}>
              {filteredSuppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  style={styles.supplierItem}
                  onPress={() => {
                    setSelectedSupplier(supplier);
                    setIsSupplierModalVisible(false);
                  }}
                >
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  <Text style={styles.supplierContact}>{supplier.contact}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Drug Selection Modal */}
      <Modal
        visible={isDrugModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDrugModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Drug to Order</Text>
              <TouchableOpacity onPress={() => setIsDrugModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search drugs..."
                value={drugSearchQuery}
                onChangeText={setDrugSearchQuery}
                placeholderTextColor={Colors.gray[500]}
              />
            </View>

            <ScrollView style={styles.drugList}>
              {filteredDrugs.map((drug) => (
                <TouchableOpacity
                  key={drug.id}
                  style={[
                    styles.drugItem,
                    selectedDrug?.id === drug.id && styles.selectedDrugItem
                  ]}
                  onPress={() => setSelectedDrug(drug)}
                >
                  <View style={styles.drugInfo}>
                    <Text style={styles.drugName}>{drug.name}</Text>
                    <Text style={styles.drugDetails}>
                      {drug.form} • {drug.strength} • SKU: {drug.sku}
                    </Text>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockText}>
                        Current Stock: {drug.currentStock}
                      </Text>
                      {drug.currentStock <= drug.minThreshold && (
                        <View style={styles.lowStockBadge}>
                          <AlertTriangle size={12} color={Colors.danger} />
                          <Text style={styles.lowStockText}>Low Stock</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDrug && (
              <View style={styles.drugForm}>
                <View style={styles.quantityContainer}>
                  <Text style={styles.formLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <Minus size={16} color={Colors.gray[700]} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => setQuantity(prev => prev + 1)}
                    >
                      <Plus size={16} color={Colors.gray[700]} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />

                <Button
                  title="Add to Order"
                  onPress={addOrderItem}
                  variant="primary"
                  style={styles.addToOrderButton}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
  },
  dropdownButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  supplierInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  supplierContact: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  supplierTerms: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  itemDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  itemQuantity: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  itemNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    fontStyle: 'italic',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    marginTop: 8,
  },
  notesInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[900],
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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
  supplierList: {
    padding: 16,
  },
  supplierItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  supplierName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  drugList: {
    padding: 16,
  },
  drugItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  selectedDrugItem: {
    backgroundColor: Colors.primary + '10',
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  drugDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  lowStockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.danger,
  },
  drugForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
    marginRight: 12,
  },
  quantityControls: {
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
  addToOrderButton: {
    marginTop: 16,
  },
}); 