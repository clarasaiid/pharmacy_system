import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { ChevronRight, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import IconButton from '@/components/ui/IconButton';

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  expiryDate: Date;
  manufacturer: string;
  image?: string;
  dosageForm: string;
  hazardous: boolean;
  protocol: string;
}

interface InventoryItemProps {
  item: Medicine;
  onPress: (item: Medicine) => void;
  onEdit: (item: Medicine) => void;
  onDelete: (item: Medicine) => void;
  safetyAlert?: string | null;
}

export default function InventoryItem({ 
  item, 
  onPress,
  onEdit,
  onDelete 
}: InventoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const isLowStock = item.stock <= item.threshold;
  
  // Calculate days until expiry
  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const isExpiringSoon = daysUntilExpiry <= 90;
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>
                {item.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.priceAndStock}>
            <Text style={styles.price}>LE {item.price.toFixed(2)}</Text>
            <View style={styles.stockContainer}>
              <Text 
                style={[
                  styles.stock, 
                  isLowStock ? styles.lowStock : null
                ]}
              >
                {item.stock} in stock
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.expandIcon}>
          <ChevronRight 
            size={20} 
            color={Colors.gray[400]}
            style={[
              styles.chevron,
              expanded ? styles.expanded : undefined
            ]}
          />
        </View>
      </View>
      
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Manufacturer:</Text>
            <Text style={styles.infoValue}>{item.manufacturer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stock Threshold:</Text>
            <Text style={styles.infoValue}>{item.threshold} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiry Date:</Text>
            <Text 
              style={[
                styles.infoValue, 
                isExpiringSoon ? styles.expiringSoon : null
              ]}
            >
              {expiryDate.toLocaleDateString()} 
              {isExpiringSoon && ` (${daysUntilExpiry} days)`}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <IconButton 
              icon={<Edit size={18} color={Colors.primary} />}
              onPress={() => onEdit(item)}
              variant="outline"
              size="medium"
              style={styles.actionButton}
            />
            <IconButton 
              icon={<Trash2 size={18} color={Colors.danger} />}
              onPress={() => onDelete(item)}
              variant="outline"
              size="medium"
              style={[styles.actionButton, styles.deleteButton]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.gray[500],
  },
  details: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[800],
    marginBottom: 2,
  },
  category: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  priceAndStock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  price: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.gray[700],
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stock: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.gray[600],
  },
  lowStock: {
    color: Colors.danger,
  },
  expandIcon: {
    padding: 4,
  },
  chevron: {
    transition: '0.3s',
  },
  expanded: {
    transform: [{ rotate: '90deg' }],
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
    width: 120,
  },
  infoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[800],
    flex: 1,
  },
  expiringSoon: {
    color: Colors.warning,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 12,
    borderColor: Colors.gray[300],
  },
  deleteButton: {
    borderColor: Colors.danger,
  },
});