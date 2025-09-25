import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Search, Plus, Filter, User, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Header from '@/components/ui/Header';

interface Customer {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  age: string;
  address: string;
  phone: string;
  insuranceCompany: string;
  insuranceNumber: string;
  lastVisit: string;
  loyaltyPoints: number;
  hasActivePrescription: boolean;
}

interface FilterOptions {
  hasActivePrescription: boolean | null;
  minLoyaltyPoints: number | null;
  lastVisitWithin: 'week' | 'month' | 'year' | null;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    age: '',
    address: '',
    phone: '+1 234 567 8900',
    insuranceCompany: '',
    insuranceNumber: '',
    lastVisit: '2024-03-15',
    loyaltyPoints: 250,
    hasActivePrescription: true,
  },
  {
    id: '2',
    firstName: 'Jane',
    middleName: '',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    age: '',
    address: '',
    phone: '+1 234 567 8901',
    insuranceCompany: '',
    insuranceNumber: '',
    lastVisit: '2024-03-10',
    loyaltyPoints: 150,
    hasActivePrescription: false,
  },
  // Add more mock data as needed
];

export default function CustomerManagementScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    hasActivePrescription: null,
    minLoyaltyPoints: null,
    lastVisitWithin: null,
  });
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    age: '',
    address: '',
    phone: '',
    insuranceCompany: '',
    insuranceNumber: '',
    lastVisit: '',
    loyaltyPoints: 0,
    hasActivePrescription: false,
  });

  const clearFilters = () => {
    setFilters({
      hasActivePrescription: null,
      minLoyaltyPoints: null,
      lastVisitWithin: null,
    });
  };

  const applyFilters = (customer: Customer) => {
    if (filters.hasActivePrescription !== null && 
        customer.hasActivePrescription !== filters.hasActivePrescription) {
      return false;
    }

    if (filters.minLoyaltyPoints !== null && 
        customer.loyaltyPoints < filters.minLoyaltyPoints) {
      return false;
    }

    if (filters.lastVisitWithin !== null) {
      const lastVisitDate = new Date(customer.lastVisit);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (filters.lastVisitWithin) {
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
        case 'year':
          if (diffDays > 365) return false;
          break;
      }
    }

    return true;
  };

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = applyFilters(customer);

    return matchesSearch && matchesFilters;
  });

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => router.push(`/customer-management/${item.id}`)}
    >
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.firstName} {item.lastName}</Text>
          {item.hasActivePrescription && (
            <View style={styles.activePrescriptionBadge}>
              <Text style={styles.activePrescriptionText}>Active Rx</Text>
            </View>
          )}
        </View>
        <Text style={styles.customerDetail}>{item.phone}</Text>
        <Text style={styles.customerDetail}>{item.email}</Text>
        <View style={styles.customerFooter}>
          <Text style={styles.lastVisit}>Last Visit: {item.lastVisit}</Text>
          <Text style={styles.loyaltyPoints}>{item.loyaltyPoints} points</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterOptions = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filter Options</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Active Prescription</Text>
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filters.hasActivePrescription === true && styles.filterOptionActive,
            ]}
            onPress={() => setFilters(prev => ({
              ...prev,
              hasActivePrescription: prev.hasActivePrescription === true ? null : true
            }))}
          >
            <Text style={[
              styles.filterOptionText,
              filters.hasActivePrescription === true && styles.filterOptionTextActive,
            ]}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              filters.hasActivePrescription === false && styles.filterOptionActive,
            ]}
            onPress={() => setFilters(prev => ({
              ...prev,
              hasActivePrescription: prev.hasActivePrescription === false ? null : false
            }))}
          >
            <Text style={[
              styles.filterOptionText,
              filters.hasActivePrescription === false && styles.filterOptionTextActive,
            ]}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Last Visit</Text>
        <View style={styles.filterOptions}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterOption,
                filters.lastVisitWithin === period && styles.filterOptionActive,
              ]}
              onPress={() => setFilters(prev => ({
                ...prev,
                lastVisitWithin: prev.lastVisitWithin === period ? null : period as any
              }))}
            >
              <Text style={[
                styles.filterOptionText,
                filters.lastVisitWithin === period && styles.filterOptionTextActive,
              ]}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Minimum Loyalty Points</Text>
        <View style={styles.filterOptions}>
          {[100, 250, 500].map((points) => (
            <TouchableOpacity
              key={points}
              style={[
                styles.filterOption,
                filters.minLoyaltyPoints === points && styles.filterOptionActive,
              ]}
              onPress={() => setFilters(prev => ({
                ...prev,
                minLoyaltyPoints: prev.minLoyaltyPoints === points ? null : points
              }))}
            >
              <Text style={[
                styles.filterOptionText,
                filters.minLoyaltyPoints === points && styles.filterOptionTextActive,
              ]}>{points}+</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const handleAddCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email || !newCustomer.age || !newCustomer.address || !newCustomer.phone || !newCustomer.insuranceCompany || !newCustomer.insuranceNumber) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    const customerToAdd: Customer = {
      id: (mockCustomers.length + 1).toString(),
      firstName: newCustomer.firstName!,
      middleName: newCustomer.middleName || '',
      lastName: newCustomer.lastName!,
      email: newCustomer.email!,
      age: newCustomer.age!,
      address: newCustomer.address!,
      phone: newCustomer.phone!,
      insuranceCompany: newCustomer.insuranceCompany!,
      insuranceNumber: newCustomer.insuranceNumber!,
      lastVisit: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
      hasActivePrescription: false,
    };
    mockCustomers.push(customerToAdd);
    setNewCustomer({
      firstName: '', middleName: '', lastName: '', email: '', age: '', address: '', phone: '', insuranceCompany: '', insuranceNumber: '', lastVisit: '', loyaltyPoints: 0, hasActivePrescription: false
    });
    setShowFilters(false);
    Alert.alert('Success', 'Customer added!');
  };

  return (
    <View style={styles.container}>
      <Header title="Customer Management" />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            Object.values(filters).some(v => v !== null) && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Object.values(filters).some(v => v !== null) ? Colors.white : Colors.primary} />
        </TouchableOpacity>
      </View>

      {showFilters && renderFilterOptions()}

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color={Colors.gray[400]} />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/customer-management/new')}
      >
        <Plus size={24} color={Colors.white} />
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.addCustomerModal}>
          <Text style={styles.modalTitle}>Add New Customer</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={newCustomer.firstName}
            onChangeText={text => setNewCustomer({ ...newCustomer, firstName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Middle Name"
            value={newCustomer.middleName}
            onChangeText={text => setNewCustomer({ ...newCustomer, middleName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={newCustomer.lastName}
            onChangeText={text => setNewCustomer({ ...newCustomer, lastName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={newCustomer.email}
            onChangeText={text => setNewCustomer({ ...newCustomer, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={newCustomer.age}
            onChangeText={text => setNewCustomer({ ...newCustomer, age: text })}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={newCustomer.address}
            onChangeText={text => setNewCustomer({ ...newCustomer, address: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={newCustomer.phone}
            onChangeText={text => setNewCustomer({ ...newCustomer, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Insurance Company"
            value={newCustomer.insuranceCompany}
            onChangeText={text => setNewCustomer({ ...newCustomer, insuranceCompany: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Insurance Number"
            value={newCustomer.insuranceNumber}
            onChangeText={text => setNewCustomer({ ...newCustomer, insuranceNumber: text })}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
            <Text style={styles.addButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.gray[800],
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.gray[100],
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
  },
  filterOptionTextActive: {
    color: Colors.white,
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
  },
  activePrescriptionBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activePrescriptionText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  customerDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  lastVisit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  loyaltyPoints: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    marginTop: 4,
  },
  addCustomerModal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
}); 