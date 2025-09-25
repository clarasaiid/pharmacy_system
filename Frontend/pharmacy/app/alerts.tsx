import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AlertCard from '@/components/dashboard/AlertCard';

const alerts = [
  {
    type: 'expiry',
    title: 'Medicine Expiry Alert',
    description: '5 medicines expiring in 30 days',
    time: '2h ago',
  },
  {
    type: 'stock',
    title: 'Low Stock Alert',
    description: 'Amoxicillin 500mg below threshold',
    time: '5h ago',
  },
  {
    type: 'payment',
    title: 'Payment Due',
    description: 'Payment due to HealthPharm Inc.',
    time: '1d ago',
  },
];

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Alerts</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {alerts.map((alert, idx) => (
          <AlertCard
            key={idx}
            type={alert.type}
            title={alert.title}
            description={alert.description}
            time={alert.time}
            onPress={() => {}}
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