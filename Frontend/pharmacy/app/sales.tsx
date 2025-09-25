import { View, Text, StyleSheet, ScrollView } from 'react-native';
import RecentSaleCard from '@/components/dashboard/RecentSaleCard';

const sales = [
  {
    customerName: 'John',
    date: new Date(2025, 1, 15, 14, 30),
    amount: 124.50,
    items: 3,
  },
  {
    customerName: 'Eman',
    date: new Date(2025, 1, 15, 13, 45),
    amount: 75.20,
    items: 2,
  },
  {
    customerName: 'Michael',
    date: new Date(2025, 1, 15, 11, 20),
    amount: 218.75,
    items: 5,
  },
];

export default function SalesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Sales</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {sales.map((sale, idx) => (
          <RecentSaleCard
            key={idx}
            customerName={sale.customerName}
            date={sale.date}
            amount={sale.amount}
            items={sale.items}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A3C6D',
    alignSelf: 'center',
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
}); 