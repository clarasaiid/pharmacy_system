import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/Colors';

export const options = {
  headerShown: false,
};

const mockInvoice = {
  invoiceNumber: 'INV-2025-101',
  invoiceDate: '2025-05-25',
  supplier: {
    name: 'MediSupply Co.',
    contact: '+1-555-0123',
  },
  pharmacy: {
    name: 'Downtown Pharmacy',
    address: '123 Main St, Downtown',
  },
  manager: 'Dr. Mohamed Ahmed',
  items: [
    { id: 1, name: 'Paracetamol', quantity: 10, unit: 'Box', price: 20, total: 200 },
    { id: 2, name: 'Ibuprofen', quantity: 5, unit: 'Strip', price: 15, total: 75 },
  ],
  deliveryDate: '2025-05-28',
  paymentMethod: 'Cash',
  paymentStatus: 'Paid',
  notes: 'Store below 25°C. Batch #A123. Exp: 2026-01-01',
  tax: 10, // LE
  discount: 5, // LE
};

const unitOptions = ['Box', 'Strip'];
const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card'];
const paymentStatuses = ['Paid', 'Unpaid'];

export default function InvoicePage() {
  const router = useRouter();
  const [items, setItems] = useState(mockInvoice.items);
  const [selectedUnits, setSelectedUnits] = useState(items.map(i => i.unit));
  const [paymentMethod, setPaymentMethod] = useState(mockInvoice.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(mockInvoice.paymentStatus);
  const [notes, setNotes] = useState(mockInvoice.notes);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + mockInvoice.tax - mockInvoice.discount;

  const handleUnitChange = (idx, newUnit) => {
    const newUnits = [...selectedUnits];
    newUnits[idx] = newUnit;
    setSelectedUnits(newUnits);
    setItems(items.map((item, i) => i === idx ? { ...item, unit: newUnit } : item));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backArrow} onPress={() => router.push('/(tabs)')}>
        <ArrowLeft size={28} color={Colors.primary} />
      </TouchableOpacity>
      <Header title="Invoice Details" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Info */}
        <Card style={styles.card} title="Invoice Header">
          <View style={styles.headerRow}>
            <View style={styles.headerCol}>
              <Text style={styles.label}>Invoice Number:</Text>
              <Text style={styles.value}>{mockInvoice.invoiceNumber}</Text>
              <Text style={styles.label}>Invoice Date:</Text>
              <Text style={styles.value}>{mockInvoice.invoiceDate}</Text>
              <Text style={styles.label}>Supplier:</Text>
              <Text style={styles.value}>{mockInvoice.supplier.name} ({mockInvoice.supplier.contact})</Text>
            </View>
            <View style={styles.headerCol}>
              <Text style={styles.label}>Pharmacy:</Text>
              <Text style={styles.value}>{mockInvoice.pharmacy.name}</Text>
              <Text style={styles.value}>{mockInvoice.pharmacy.address}</Text>
              <Text style={styles.label}>Manager:</Text>
              <Text style={styles.value}>{mockInvoice.manager}</Text>
            </View>
          </View>
        </Card>

        {/* Item Table */}
        <Card style={styles.card} title="Drug/Item Details">
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeader}>#</Text>
            <Text style={styles.tableHeader}>Medicine Name</Text>
            <Text style={styles.tableHeader}>Quantity</Text>
            <Text style={styles.tableHeader}>Unit</Text>
            <Text style={styles.tableHeader}>Price/Unit</Text>
            <Text style={styles.tableHeader}>Total</Text>
          </View>
          {items.map((item, idx) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.id}</Text>
              <Text style={styles.tableCell}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              {/* Unit selection */}
              <View style={[styles.tableCell, { flexDirection: 'row', alignItems: 'center' }]}> 
                {unitOptions.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitOption, selectedUnits[idx] === unit && styles.unitSelected]}
                    onPress={() => handleUnitChange(idx, unit)}
                  >
                    <Text style={{ fontSize: 12 }}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.tableCell}>LE {item.price.toFixed(2)}</Text>
              <Text style={styles.tableCell}>LE {item.total.toFixed(2)}</Text>
            </View>
          ))}
        </Card>

        {/* Summary Section */}
        <Card style={styles.card} title="Summary">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>LE {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>LE {mockInvoice.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount:</Text>
            <Text style={styles.summaryValue}>LE {mockInvoice.discount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Total Amount Due:</Text>
            <Text style={[styles.summaryValue, { fontWeight: 'bold', color: Colors.primary }]}>LE {total.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Additional Info */}
        <Card style={styles.card} title="Additional Info">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Date:</Text>
            <Text style={styles.summaryValue}>{mockInvoice.deliveryDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.unitOption, paymentMethod === method && styles.unitSelected]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={{ fontSize: 12 }}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Status:</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {paymentStatuses.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[styles.unitOption, paymentStatus === status && styles.unitSelected]}
                  onPress={() => setPaymentStatus(status)}
                >
                  <Text style={{ fontSize: 12 }}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Notes:</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </Card>

        {/* Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 16, gap: 8 }}>
          <Button title="Print" onPress={() => { if (typeof window !== 'undefined' && window.print) window.print(); }} />
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.gray[100],
  },
  backArrow: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  headerCol: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: Colors.gray[600],
    marginTop: 4,
  },
  value: {
    fontSize: 14,
    color: Colors.gray[900],
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomColor: Colors.gray[100],
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
  },
  unitOption: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 2,
    backgroundColor: Colors.white,
  },
  unitSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    color: Colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.gray[700],
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.gray[900],
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: 8,
    minHeight: 48,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
}); 