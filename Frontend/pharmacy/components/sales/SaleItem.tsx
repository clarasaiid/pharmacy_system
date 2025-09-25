import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { format } from 'date-fns';
import { ChevronRight, Receipt } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export interface Sale {
  id: string;
  customerName: string;
  customerImage?: string;
  items: number;
  totalAmount: number;
  date: Date;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface SaleItemProps {
  sale: Sale;
  onPress: (sale: Sale) => void;
}

export default function SaleItem({ sale, onPress }: SaleItemProps) {
  const getStatusColor = () => {
    switch(sale.status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.danger;
      default:
        return Colors.gray[500];
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(sale)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {sale.customerImage ? (
            <Image 
              source={{ uri: sale.customerImage }} 
              style={styles.customerImage} 
            />
          ) : (
            <View style={styles.customerImagePlaceholder}>
              <Text style={styles.customerInitial}>
                {sale.customerName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{sale.customerName}</Text>
            <View style={styles.idContainer}>
              <Receipt size={12} color={Colors.gray[500]} />
              <Text style={styles.saleId}>#{sale.id}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>LE {sale.totalAmount.toFixed(2)}</Text>
          <ChevronRight size={20} color={Colors.gray[400]} />
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{format(sale.date, 'MMM dd, yyyy')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{sale.items}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <Text style={styles.detailValue}>{sale.paymentMethod}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, { color: getStatusColor() }]}>
            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
          </Text>
        </View>
      </View>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  customerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saleId: {
    fontSize: 12,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  detailValue: {
    fontSize: 13,
    color: Colors.gray[800],
    fontWeight: '500',
  },
});