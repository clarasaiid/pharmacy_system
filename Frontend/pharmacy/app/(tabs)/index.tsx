import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Package, FileText, DollarSign, Users, ChartBar as BarChart4, X as XIcon, Calendar as CalendarIcon, CreditCard, Plus } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import RecentSaleCard from '@/components/dashboard/RecentSaleCard';
import AlertCard from '@/components/dashboard/AlertCard';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import type { AlertType, Priority } from '@/components/dashboard/AlertCard';
import { Calendar } from 'react-native-calendars';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// Mock API functions for a generic pharmacy system
const fetchDashboardStats = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        sales: "LE 1,245.89",
        inventory: "2,453",
        prescriptions: "24",
        customers: "867",
        salesChange: 12.5,
        inventoryChange: -3.2,
        prescriptionsChange: 5.7,
      });
    }, 1000);
  });
};

const fetchAlerts = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { type: 'expiry', title: 'Medicine Expiry', description: 'Paracetamol expiring in 15 days', time: '2h ago', priority: 'critical' },
        { type: 'stock', title: 'Low Stock Alert', description: 'Amoxicillin 500mg below threshold', time: '5h ago', priority: 'high' },
        { type: 'payment', title: 'Payment Due', description: 'Payment due to HealthPharm Inc.', time: '1d ago', priority: 'medium' },
      ]);
    }, 1000);
  });
};

const fetchRecentSales = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { customerName: "Mohamed", date: new Date(2025, 4, 23, 14, 30), amount: 124.50, items: 3 },
        { customerName: "Mahmoud", date: new Date(2025, 4, 23, 13, 45), amount: 75.20, items: 2 },
        { customerName: "Mariam", date: new Date(2025, 4, 23, 11, 20), amount: 218.75, items: 5 },
      ]);
    }, 1000);
  });
};

const fetchTopSellingDrugs = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Paracetamol", sales: "LE 2,432", units: 120 },
        { name: "Amoxicillin", sales: "LE 1,987", units: 85 },
        { name: "Ibuprofen", sales: "LE 1,543", units: 60 },
      ]);
    }, 1000);
  });
};

// Interfaces
interface DashboardStats {
  sales: string;
  inventory: string;
  prescriptions: string;
  customers: string;
  salesChange: number;
  inventoryChange: number;
  prescriptionsChange: number;
}

interface Alert {
  type: AlertType;
  title: string;
  description: string;
  time: string;
  priority?: Priority;
}

interface Sale {
  customerName: string;
  customerImage?: string;
  date: Date;
  amount: number;
  items: number;
}

interface Drug {
  name: string;
  sales: string;
  units: number;
}

interface MarkedDates {
  [date: string]: {
    selected?: boolean;
    marked?: boolean;
    dotColor?: string;
    selectedColor?: string;
    text?: string;
  };
}

// Updated mock data function with current dates
const fetchCalendarEvents = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        '2025-05-25': { marked: true, dotColor: Colors.primary, text: 'Supplier Delivery' },
        '2025-05-27': { marked: true, dotColor: Colors.secondary, text: 'Staff Meeting' },
        '2025-05-29': { marked: true, dotColor: Colors.accent, text: 'Inventory Check' },
      });
    }, 500);
  });
};

// Sample data for the new dashboard layout
const medicineOverview = [
  { label: 'Total Medicines', value: '1,200', icon: <CalendarIcon size={20} color={Colors.primary} />, color: Colors.primary, bg: Colors.gray[100] },
  { label: 'Low Stock Medicines', value: '8', icon: <Package size={20} color={Colors.warning} />, color: Colors.warning, bg: Colors.gray[100] },
  { label: 'Expired Medicines', value: '3', icon: <XIcon size={20} color={Colors.danger} />, color: Colors.danger, bg: Colors.gray[100] },
  { label: 'Near. Expiry Medicines', value: '12', icon: <FileText size={20} color={Colors.accent} />, color: Colors.accent, bg: Colors.gray[100] },
];

const expiryAlerts = [
  { name: 'Panadol', date: '12 Jun 2025', stock: 20 },
  { name: 'Augmentin', date: '1 Jul 2025', stock: 15 },
];

const expiry = [
  { name: 'Panadol', date: '12 Jun 2025', stock: 20 },
  { name: 'Augmentin', date: '1 Jul 2025', stock: 15 },
];

// Pie chart data for 'Highest demand for drugs'
const demandData = [
  { name: 'Paracetamol', value: 54, color: Colors.primary },
  { name: 'Ibuprofen', value: 28, color: Colors.secondary },
  { name: 'Antasida', value: 18, color: Colors.accent },
];

// Add mock data for pending orders
const pendingOrders = [
  { name: 'Paracetamol', eta: '12 Jun 2025' },
  { name: 'Ibuprofen', eta: '15 Jun 2025' },
  { name: 'Amoxicillin', eta: '20 Jun 2025' },
];

// PieChart component
function PieChart({ data, size = 120, strokeWidth = 0, onSelect }: any) {
  const [selected, setSelected] = useState(-1);
  const total = data.reduce((sum: number, d: any) => sum + d.value, 0);
  let startAngle = 0;
  const center = size / 2;
  const radius = center - strokeWidth;

  return (
    <Svg width={size} height={size}>
      <G>
        {data.map((slice: any, idx: number) => {
          const angle = (slice.value / total) * 360;
          const endAngle = startAngle + angle;
          const largeArc = angle > 180 ? 1 : 0;
          const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
          const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
          const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
          const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);
          const pathData = [
            `M ${center} ${center}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z',
          ].join(' ');
          const isSelected = selected === idx;
          const midAngle = startAngle + angle / 2;
          const labelX = center + (radius / 1.5) * Math.cos((Math.PI * midAngle) / 180);
          const labelY = center + (radius / 1.5) * Math.sin((Math.PI * midAngle) / 180);
          const sliceProps = {
            fill: isSelected ? Colors.info : slice.color,
            stroke: '#fff',
            strokeWidth: 2,
            onPress: () => {
              setSelected(idx);
              if (onSelect) onSelect(slice, idx);
            },
          };
          startAngle += angle;
          return (
            <G key={idx}>
              <Path d={pathData} {...sliceProps} />
              {isSelected && (
                <SvgText
                  x={labelX}
                  y={labelY}
                  fill={Colors.gray[900]}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {slice.value}%
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

// Helper to merge styles for components that don't accept arrays
const getMergedStyle = (...styles: any[]) => Object.assign({}, ...styles.filter(Boolean));

// Add Inventory Overview data
const inventoryOverview = [
  { label: 'Total', value: 1200, color: Colors.primary },
  { label: 'Low Stock', value: 8, color: Colors.warning },
  { label: 'Expired', value: 3, color: Colors.danger },
  { label: 'Near Expiry', value: 12, color: Colors.accent },
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    sales: "LE 0.00",
    inventory: "0",
    prescriptions: "0",
    customers: "0",
    salesChange: 0,
    inventoryChange: 0,
    prescriptionsChange: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topSellingDrugs, setTopSellingDrugs] = useState<Drug[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, alertsData, salesData, topDrugsData, calendarData] = await Promise.all([
        fetchDashboardStats(),
        fetchAlerts(),
        fetchRecentSales(),
        fetchTopSellingDrugs(),
        fetchCalendarEvents(),
      ]);
      setStats(statsData as DashboardStats);
      setAlerts(alertsData as Alert[]);
      setRecentSales(salesData as Sale[]);
      setTopSellingDrugs(topDrugsData as Drug[]);
      setMarkedDates(calendarData as MarkedDates);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={loadDashboardData} variant="primary" style={styles.retryButton} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header title="Dashboard" />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions (pill-shaped, full row) */}
        <View style={styles.quickActionsRowWrap}>
          {[
            { label: 'Customers', icon: <Users size={22} color={Colors.white} />, onPress: () => router.push('/customer-management'), color: Colors.primary },
            { label: 'Payment', icon: <DollarSign size={22} color={Colors.white} />, onPress: () => router.push('/payment'), color: Colors.accent },
            { label: 'Invoices', icon: <FileText size={22} color={Colors.white} />, onPress: () => router.push('/invoices/invoices'), color: Colors.secondary },
            { label: 'New prescription', icon: <FileText size={22} color={Colors.white} />, onPress: () => router.push({ pathname: '/prescriptions', params: { add: 'true' } }), color: Colors.primary },
            { label: 'New Order', icon: <Package size={22} color={Colors.white} />, onPress: () => router.push('/supplier-order'), color: Colors.secondary },
          ].map((action, idx) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.pillButton, { backgroundColor: action.color }]}
              onPress={action.onPress}
            >
              {action.icon}
              <Text style={styles.pillButtonText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.mainGrid, isMobile ? styles.mainGridMobile : undefined, { alignItems: 'stretch' }]}>
          {/* Left Column */}
          <View style={[styles.leftCol, isMobile ? styles.colMobile : undefined]}>
            {/* Alerts, Pending Orders, and Last Transaction side by side */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 0, alignItems: 'stretch' }}>
              {/* Critical Alerts */}
              <Card style={Object.assign({}, getMergedStyle(styles.sectionCard, isMobile ? styles.cardMobile : undefined), { flex: 1, width: '48%', marginRight: 0, marginLeft: 0, marginBottom: 0 })} title="Critical Alerts">
                {alerts
                  .filter(alert => alert.priority === 'critical' || alert.priority === 'high')
                  .map((alert, index) => (
                    <AlertCard 
                      key={index}
                      type={alert.type}
                      title={alert.title} 
                      description={alert.description}
                      time={alert.time}
                      onPress={() => router.push('/alerts')}
                      priority={alert.priority}
                    />
                  ))}
                <Button
                  title="View All Alerts"
                  variant="outline"
                  size="small"
                  onPress={() => router.push('/alerts')}
                  style={styles.viewAllButton}
                />
              </Card>
              {/* Pending Orders + Last Transaction stacked vertically */}
              <View style={{ flex: 1, flexDirection: 'column', gap: 8 }}>
                <Card style={Object.assign({}, getMergedStyle(styles.sectionCard, isMobile ? styles.cardMobile : undefined), { width: '100%', marginRight: 0, marginLeft: 0, marginBottom: 0 })} title="Pending Orders">
                  {pendingOrders.map((order, idx) => (
                    <View key={order.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ flex: 1, fontSize: 13, color: Colors.gray[800] }}>{order.name}</Text>
                      <Text style={{ fontSize: 12, color: Colors.gray[500], marginRight: 10 }}>ETA: {order.eta}</Text>
                      <Button
                        title="Reorder"
                        size="small"
                        variant="outline"
                        onPress={() => router.push('/supplier-order')}
                        style={{ paddingHorizontal: 8, paddingVertical: 2 }}
                      />
                    </View>
                  ))}
                </Card>
                <Card style={Object.assign({}, getMergedStyle(styles.sectionCard, isMobile ? styles.cardMobile : undefined), { width: '100%', marginRight: 0, marginLeft: 0, marginBottom: 0 })} title="Last Transaction">
                  <View style={styles.tableHeaderRow}>
                    <Text style={styles.tableHeader}>No.</Text>
                    <Text style={styles.tableHeader}>Medicine Name</Text>
                    <Text style={styles.tableHeader}>Total</Text>
                    <Text style={styles.tableHeader}>Price</Text>
                  </View>
                  {recentSales.slice(0, 5).map((sale, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{idx + 1}</Text>
                      <Text style={styles.tableCell}>{sale.customerName}</Text>
                      <Text style={styles.tableCell}>{sale.items} item(s)</Text>
                      <Text style={styles.tableCell}>LE {sale.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                  <Button title="View All" onPress={() => router.push('/sales')} size="small" variant="outline" style={styles.viewAllButton} />
                </Card>
              </View>
            </View>
          </View>
          {/* Right Column */}
          <View style={[styles.rightCol, isMobile ? styles.colMobile : undefined]}>
            {/* Supplier Info and Calendar side by side (or stacked on mobile) */}
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 8, alignItems: 'stretch' }}>
              {/* Supplier Info Card */}
              <Card style={Object.assign({}, getMergedStyle(styles.calendarCard, isMobile ? styles.cardMobile : undefined), { flex: 1, width: '100%', maxWidth: undefined, marginRight: 0, marginLeft: 0, marginBottom: 0 })}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Supplier Info</Text>
                </View>
                <ScrollView 
                  style={{ maxHeight: 300 }}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingRight: 8 }}
                >
                  {/* Supplier Details Section */}
                  <View style={styles.supplierHeader}>
                    <View style={styles.supplierInfo}>
                      <Text style={styles.supplierName}>MediSupply Co.</Text>
                      <View style={styles.supplierStatus}>
                        <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.statusText}>Active</Text>
                      </View>
                    </View>
                    <View style={styles.supplierContact}>
                      <Text style={styles.contactLabel}>Contact</Text>
                      <Text style={styles.contactValue}>+1-555-0123</Text>
                      <Text style={styles.contactLabel}>Email</Text>
                      <Text style={styles.contactValue}>contact@medisupply.com</Text>
                    </View>
                  </View>

                  {/* Delivery Terms */}
                  <View style={styles.deliveryTerms}>
                    <Text style={styles.sectionTitle}>Delivery Terms</Text>
                    <View style={styles.termsGrid}>
                      <View style={styles.termItem}>
                        <Text style={styles.termLabel}>Lead Time</Text>
                        <Text style={styles.termValue}>2-3 days</Text>
                      </View>
                      <View style={styles.termItem}>
                        <Text style={styles.termLabel}>Payment Terms</Text>
                        <Text style={styles.termValue}>Net 30</Text>
                      </View>
                      <View style={styles.termItem}>
                        <Text style={styles.termLabel}>Min. Order</Text>
                        <Text style={styles.termValue}>LE 500</Text>
                      </View>
                    </View>
                  </View>

                  {/* Recent Orders */}
                  <View style={styles.recentOrders}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <View style={styles.ordersList}>
                      {[
                        { name: 'Atorvastatin', qty: 100, status: 'Delivered', date: '2025-05-20' },
                        { name: 'Lisinopril', qty: 50, status: 'Pending', date: '2025-05-22' },
                        { name: 'Metformin', qty: 200, status: 'Delivered', date: '2025-05-18' },
                        { name: 'Omeprazole', qty: 150, status: 'Delivered', date: '2025-05-15' },
                        { name: 'Amlodipine', qty: 75, status: 'Pending', date: '2025-05-23' },
                        { name: 'Simvastatin', qty: 120, status: 'Delivered', date: '2025-05-17' },
                      ].map((order, index) => (
                        <View key={index} style={styles.orderItem}>
                          <View style={styles.orderInfo}>
                            <Text style={styles.orderName}>{order.name}</Text>
                            <Text style={styles.orderDate}>{order.date}</Text>
                          </View>
                          <View style={styles.orderDetails}>
                            <Text style={styles.orderQty}>Qty: {order.qty}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: order.status === 'Delivered' ? Colors.success : Colors.warning }]}>
                              <Text style={styles.orderStatusText}>{order.status}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </Card>
              {/* Calendar Card */}
              <Card style={Object.assign({}, getMergedStyle(styles.calendarCard, isMobile ? styles.cardMobile : undefined), { flex: 1, width: '100%', maxWidth: undefined, marginRight: 0, marginLeft: 0, marginBottom: 0 })}>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>Calendar</Text>
                </View>
                <View style={{ width: '100%' }}>
                  <Calendar
                    onDayPress={(day) => setSelectedDate(day.dateString)}
                    markedDates={{
                      ...markedDates,
                      [selectedDate]: {
                        ...markedDates[selectedDate],
                        selected: true,
                        selectedColor: Colors.primary,
                      },
                    }}
                    firstDay={6}
                    style={{ borderRadius: 12, width: '100%', height: 340, marginTop: -8 }}
                    theme={{
                      textDayFontSize: 14,
                      textMonthFontSize: 18,
                      textDayHeaderFontSize: 12,
                    }}
                  />
                </View>
                {/* Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.legendLabel}>Supplier Delivery</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
                    <Text style={styles.legendLabel}>Staff Meeting</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                    <Text style={styles.legendLabel}>Inventory Check</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.gray[100],
  },
  dashboardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: Colors.gray[900],
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 8,
    paddingBottom: 16,
  },
  quickActionsRowWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  pillButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pillButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.gray[700],
    textAlign: 'center',
  },
  mainGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
    gap: 12,
  },
  mainGridMobile: {
    flexDirection: 'column',
    gap: 0,
    width: '100%',
  },
  leftCol: {
    flex: 1,
    width: '50%',
    gap: 0,
    margin: 0,
    padding: 0,
  },
  rightCol: {
    flex: 1,
    width: '50%',
    gap: 0,
    margin: 0,
    padding: 0,
  },
  colMobile: {
    width: '100%',
    gap: 0,
  },
  cardMobile: {
    borderRadius: 8,
    marginBottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sectionCard: {
    borderRadius: 10,
    margin: 0,
    elevation: 1,
    padding: 25,
  },
  calendarCard: {
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 0,
    margin: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarContainer: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  calendarPro: {
    borderRadius: 8,
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 4,
    width: '100%',
    height: 140,
    minHeight: 100,
    maxHeight: 100,
  },
  calendarProMobile: {
    minHeight: 100,
    maxHeight: 120,
    height: 100,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 3,
  },
  legendLabel: {
    fontSize: 10,
    color: '#222',
    fontFamily: 'Inter-Regular',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    marginBottom: 2,
  },
  tableHeader: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.gray[700],
    flex: 1,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  tableCell: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.gray[800],
    flex: 1,
    textAlign: 'left',
  },
  viewAllButton: {
    marginTop: 6,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 6,
  },
  supplierScrollView: {
    maxHeight: 300,
  },
  supplierScrollContent: {
    paddingRight: 8,
  },
  supplierHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  supplierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  supplierStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.gray[700],
  },
  supplierContact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: Colors.gray[800],
  },
  deliveryTerms: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  termsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 8,
  },
  termItem: {
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginBottom: 2,
  },
  termValue: {
    fontSize: 12,
    color: Colors.gray[800],
    fontWeight: '500',
  },
  recentOrders: {
    marginBottom: 8,
  },
  ordersList: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 13,
    color: Colors.gray[800],
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderQty: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '500',
  },
  cardTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[900],
  },
});