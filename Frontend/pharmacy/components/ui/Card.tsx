import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import React, { ReactNode } from 'react';
import Colors from '@/constants/Colors';

interface CardProps {
  title?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  children: ReactNode;
}

export default function Card({ title, style, titleStyle, children }: CardProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[800],
    marginBottom: 12,
  },
});