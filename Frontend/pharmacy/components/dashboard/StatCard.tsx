import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import Card from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  changePercentage?: number;
  iconBackgroundColor?: string;
  unit?: string; // e.g., "items", "LE"
  lastUpdated?: Date; // When the stat was last updated
  onPress?: () => void; // Optional callback for interactivity
  isLoading?: boolean; // Loading state for async data
}

export default function StatCard({
  title,
  value,
  icon,
  changePercentage,
  iconBackgroundColor = Colors.primary,
  unit,
  lastUpdated,
  onPress,
  isLoading = false,
}: StatCardProps) {
  const isPositiveChange = changePercentage && changePercentage > 0;
  const isNeutralChange = changePercentage === 0;
  const changeColor = isNeutralChange ? Colors.gray[500] : isPositiveChange ? Colors.success : Colors.danger;

  // Format the last updated time if provided
  const formattedLastUpdated = lastUpdated
    ? `Last updated: ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${title}: ${value}${unit ? ` ${unit}` : ''}${
        changePercentage !== undefined ? `, Change: ${changePercentage}%` : ''
      }${formattedLastUpdated ? `, ${formattedLastUpdated}` : ''}`}
      accessibilityRole="button"
    >
      <Card style={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={[iconBackgroundColor, Colors.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            {icon}
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <Text style={styles.value}>
                {value}
                {unit && <Text style={styles.unit}> {unit}</Text>}
              </Text>
              {changePercentage !== undefined && (
                <View
                  style={[
                    styles.changeContainer,
                    {
                      backgroundColor: isNeutralChange
                        ? 'rgba(100, 116, 139, 0.1)'
                        : isPositiveChange
                        ? 'rgba(52, 168, 83, 0.1)'
                        : 'rgba(234, 67, 53, 0.1)',
                    },
                  ]}
                >
                  {isNeutralChange ? (
                    <Minus size={14} color={changeColor} />
                  ) : isPositiveChange ? (
                    <ArrowUpRight size={14} color={changeColor} />
                  ) : (
                    <ArrowDownRight size={14} color={changeColor} />
                  )}
                  <Text style={[styles.changeText, { color: changeColor }]}>
                    {Math.abs(changePercentage)}%
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
        {formattedLastUpdated && (
          <Text style={styles.lastUpdated}>{formattedLastUpdated}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1A3C6D',
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  value: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 28,
    color: '#111827',
  },
  unit: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#64748B',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  lastUpdated: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});