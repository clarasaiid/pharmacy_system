import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Clock, X, Pill } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { formatDistanceToNow } from 'date-fns';

export type AlertType = 'expiry' | 'stock' | 'payment' | 'recall' | 'system';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

interface AlertCardProps {
  type: AlertType;
  title: string;
  description: string;
  time: string; // ISO string or timestamp (e.g., "2025-05-20T01:20:00Z")
  priority?: Priority;
  onPress: () => void;
  onDismiss?: (type: AlertType, title: string) => void; // Optional dismiss callback
}

export default function AlertCard({ 
  type, 
  title, 
  description, 
  time, 
  priority = 'medium', 
  onPress,
  onDismiss,
}: AlertCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'expiry':
        return <Clock size={20} color={Colors.warning} />;
      case 'stock':
        return <AlertTriangle size={20} color={Colors.danger} />;
      case 'payment':
        return <AlertCircle size={20} color={Colors.primary} />;
      case 'recall':
        return <Pill size={20} color={Colors.danger} />;
      case 'system':
        return <AlertCircle size={20} color={Colors.gray[500]} />;
      default:
        return <AlertCircle size={20} color={Colors.primary} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'expiry':
        return Colors.warning;
      case 'stock':
        return Colors.danger;
      case 'payment':
        return Colors.primary;
      case 'recall':
        return Colors.danger;
      case 'system':
        return Colors.gray[500];
      default:
        return Colors.primary;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'critical':
        return Colors.danger;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.primary;
      case 'low':
        return Colors.gray[500];
      default:
        return Colors.primary;
    }
  };

  // Format the time dynamically using date-fns
  const formattedTime = () => {
    try {
      const date = new Date(time);
      return formatDistanceToNow(date, { addSuffix: true }); // e.g., "2 hours ago"
    } catch (error) {
      return time; // Fallback to raw time if parsing fails
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: getColor() }]} 
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Alert: ${title}, ${description}, Priority: ${priority}, Time: ${formattedTime()}`}
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: `${getPriorityColor()}20` }]}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor()}20` }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor() }]}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.time}>{formattedTime()}</Text>
        {onDismiss && (
          <TouchableOpacity 
            onPress={() => onDismiss(type, title)} 
            style={styles.dismissButton}
            accessibilityLabel={`Dismiss alert: ${title}`}
          >
            <X size={16} color={Colors.gray[500]} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4, // Added border for visual distinction
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1A3C6D',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#64748B',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  dismissButton: {
    marginTop: 4,
    padding: 4,
  },
});