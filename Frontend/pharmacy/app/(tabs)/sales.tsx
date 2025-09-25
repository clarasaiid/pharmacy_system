import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, useWindowDimensions, Text, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, Calendar, Plus, TrendingUp } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import SaleItem, { Sale } from '@/components/sales/SaleItem';
import Colors from '@/constants/Colors';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Sample data
const SALES: Sale[] = [
  {
    id: 'INV-2025-001',
    customerName: 'Mohamed Ali',
    items: 5,
    totalAmount: 125.75,
    date: new Date(2025, 1, 15),
    paymentMethod: 'Credit Card',
    status: 'completed',
  },
  {
    id: 'INV-2025-002',
    customerName: 'Eman Hassan',
    items: 2,
    totalAmount: 43.50,
    date: new Date(2025, 1, 14),
    paymentMethod: 'Cash',
    status: 'completed',
  },
  {
    id: 'INV-2025-003',
    customerName: 'Ahmed Mahmoud',
    items: 3,
    totalAmount: 78.25,
    date: new Date(2025, 1, 14),
    paymentMethod: 'Credit Card',
    status: 'pending',
  },
  {
    id: 'INV-2025-004',
    customerName: 'Amany Mostafa',
    items: 1,
    totalAmount: 23.99,
    date: new Date(2025, 1, 13),
    paymentMethod: 'Cash',
    status: 'completed',
  },
  {
    id: 'INV-2025-005',
    customerName: 'Mahmoud Ibrahim',
    items: 4,
    totalAmount: 105.30,
    date: new Date(2025, 1, 12),
    paymentMethod: 'Credit Card',
    status: 'cancelled',
  },
];

// Filter options
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

// Mock top drug sales data
const TOP_DRUGS = [
  { name: 'Paracetamol', sales: 120 },
  { name: 'Amoxicillin', sales: 85 },
  { name: 'Ibuprofen', sales: 60 },
  { name: 'Aspirin', sales: 55 },
  { name: 'Cetirizine', sales: 50 },
  { name: 'Metformin', sales: 45 },
  { name: 'Omeprazole', sales: 40 },
  { name: 'Atorvastatin', sales: 38 },
  { name: 'Azithromycin', sales: 35 },
  { name: 'Lisinopril', sales: 30 },
  { name: 'Simvastatin', sales: 28 },
  { name: 'Losartan', sales: 25 },
  { name: 'Gabapentin', sales: 22 },
  { name: 'Levothyroxine', sales: 20 },
];

// Sample data for the chart
const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [20000, 45000, 28000, 80000, 99000, 43000],
      color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const [searchQuery, setSearchQuery] = useState('');
  const [sales, setSales] = useState(SALES);
  const [activeFilter, setActiveFilter] = useState('all');
  const [cardWidth, setCardWidth] = useState(0);
  
  // Search function
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = SALES.filter(
        sale => 
          sale.customerName.toLowerCase().includes(text.toLowerCase()) ||
          sale.id.toLowerCase().includes(text.toLowerCase())
      );
      setSales(filtered);
    } else {
      filterSales(activeFilter);
    }
  };
  
  // Filter function
  const filterSales = (filterKey: string) => {
    setActiveFilter(filterKey);
    
    if (filterKey === 'all') {
      setSales(SALES);
    } else {
      const filtered = SALES.filter(
        sale => sale.status === filterKey
      );
      setSales(filtered);
    }
  };
  
  // Handle sale press
  const handleSalePress = (sale: Sale) => {
    console.log('Sale pressed:', sale);
    // Navigate to sale details
  };
  
  // Render item
  const renderItem = ({ item }: { item: Sale }) => (
    <SaleItem
      sale={item}
      onPress={handleSalePress}
    />
  );
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header 
        title="Sales & Billing" 
        rightComponent={
          <TouchableOpacity style={styles.calendarButton}>
            <Calendar size={20} color={Colors.gray[700]} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        {/* Responsive Two-Column Layout */}
        <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
          {/* Left: People List Card */}
          <View style={[styles.peopleCard, isMobile && styles.colMobile]}>
            <View style={styles.peopleCardHeader}>
              <Text style={styles.peopleCardTitle}>Recent Customers</Text>
              <TouchableOpacity style={styles.filterButtonContainer}>
                <Filter size={20} color={Colors.gray[600]} />
              </TouchableOpacity>
            </View>
            
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={Colors.gray[400]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterTabs}>
              <FlatList
                data={FILTERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.filterTabsContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterTab,
                      activeFilter === item.key && styles.activeFilterTab
                    ]}
                    onPress={() => filterSales(item.key)}
                  >
                    <Button
                      title={item.label}
                      variant={activeFilter === item.key ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => filterSales(item.key)}
                      style={styles.filterButton}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* People List */}
            <View style={styles.peopleListContainer}>
              <FlatList
                data={sales}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.peopleList}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                style={styles.peopleListScroll}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />
            </View>
          </View>

          {/* Right: Total Sales + Top Drugs */}
          <View style={[styles.leftCol, isMobile && styles.colMobile]}>
            {/* Total Sales Card with Chart */}
            <View
              style={styles.totalSalesCard}
              onLayout={e => setCardWidth(e.nativeEvent.layout.width)}
            >
              <View style={styles.totalSalesHeader}>
                <View>
                  <Text style={styles.totalSalesLabel}>Total Sales</Text>
                  <Text style={styles.totalSalesValue}>
                    EGP {sales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.trendIndicator}>
                  <TrendingUp size={20} color={Colors.success} />
                  <Text style={styles.trendText}>+12.5%</Text>
                </View>
              </View>
              
              <View style={styles.chartContainer}>
                {cardWidth > 0 && (
                  <LineChart
                    data={chartData}
                    width={cardWidth - 32}
                    height={120}
                    chartConfig={{
                      backgroundColor: Colors.white,
                      backgroundGradientFrom: Colors.white,
                      backgroundGradientTo: Colors.white,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                      style: {
                        borderRadius: 12,
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '1',
                        stroke: Colors.primary,
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: Colors.gray[200],
                        strokeWidth: 1,
                      },
                      propsForLabels: {
                        fontSize: 10,
                        fontFamily: 'Inter-Medium',
                      },
                    }}
                    bezier
                    style={styles.chart}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    fromZero={true}
                  />
                )}
              </View>
            </View>

            {/* Top Drug Sales */}
            <View style={styles.topDrugsCard}>
              <Text style={styles.topDrugsTitle}>Top Drug Sales</Text>
              <ScrollView
                style={styles.topDrugsScroll}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={true}
              >
                {TOP_DRUGS.map((drug, idx) => (
                  <View key={idx} style={styles.topDrugRow}>
                    <Text style={styles.topDrugName}>{drug.name}</Text>
                    <Text style={styles.topDrugValue}>{drug.sales} sales</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  topRowMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  leftCol: {
    flex: 1,
    gap: 16,
  },
  rightCol: {
    flex: 2,
    gap: 12,
  },
  colMobile: {
    width: '100%',
    gap: 8,
  },
  totalSalesCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 180,
    overflow: 'hidden',
  },
  totalSalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  totalSalesLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
  },
  totalSalesValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.primary,
    marginTop: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.success,
    marginLeft: 2,
  },
  chartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  chart: {
    marginVertical: 4,
    borderRadius: 12,
  },
  topDrugsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 210,
  },
  topDrugsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.gray[800],
    marginBottom: 12,
  },
  topDrugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  topDrugName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[700],
  },
  topDrugValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  peopleCard: {
    flex: 2,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 450,
  },
  peopleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  peopleCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.gray[800],
  },
  peopleListContainer: {
    flex: 1,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    height: 450,
    overflow: 'hidden',
  },
  peopleList: {
    padding: 12,
  },
  peopleListScroll: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[800],
  },
  filterTabs: {
    marginBottom: 16,
  },
  filterTabsContent: {
    paddingRight: 16,
  },
  filterTab: {
    marginRight: 12,
  },
  activeFilterTab: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  filterButton: {
    marginLeft: 0,
  },
  filterButtonContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  calendarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  topDrugsScroll: {
    maxHeight: 150,
  },
});