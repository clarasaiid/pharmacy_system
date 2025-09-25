import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import Colors from '@/constants/Colors';
import { ActivityIndicator } from 'react-native';

interface RecentSaleProps {
  customerName: string;
  customerImage?: string;
  date: Date;
  amount: number;
  items: number;
  saleId?: string;
  paymentStatus?: 'paid' | 'pending';
  onPress?: () => void;
}

export default function RecentSaleCard({ 
  customerName, 
  customerImage, 
  date, 
  amount, 
  items,
  saleId,
  paymentStatus = 'paid',
  onPress,
}: RecentSaleProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isImageError, setIsImageError] = useState(false);

  // Determine if the sale is recent (within 24 hours) for relative time
  const isRecent = (new Date().getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
  const formattedDate = isRecent ? formatDistanceToNow(date, { addSuffix: true }) : format(date, 'MMM dd, h:mm a');

  const getPaymentColor = () => {
    return paymentStatus === 'pending' ? Colors.warning : Colors.success;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Sale for ${customerName}, Amount: LE ${amount.toFixed(2)}, ${items} items, Date: ${formattedDate}, Status: ${paymentStatus}, ID: ${saleId || 'N/A'}`}
      accessibilityRole="button"
      disabled={!onPress}
    >
      {customerImage ? (
        <>
          {isImageLoading && <ActivityIndicator style={styles.image} color={Colors.gray[500]} />}
          <Image 
            source={{ uri: customerImage }} 
            style={styles.image}
            onLoadStart={() => setIsImageLoading(true)}
            onLoadEnd={() => setIsImageLoading(false)}
            onError={() => {
              setIsImageLoading(false);
              setIsImageError(true);
            }}
          />
          {isImageError && (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>{customerName.charAt(0)}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>{customerName.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={[styles.paymentStatus, { color: getPaymentColor() }]}>
            {paymentStatus.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.footer}>
          <Text style={styles.amount}>LE {amount.toFixed(2)}</Text>
          <Text style={styles.items}>{items} items</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[600],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
  },
  paymentStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.gray[800],
  },
  items: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
});