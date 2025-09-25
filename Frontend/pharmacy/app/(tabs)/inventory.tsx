import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Plus, Info, AlertCircle, Pill, Package, Archive, ArrowDown, ArrowUp } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import InventoryItem, { Medicine } from '@/components/inventory/InventoryItem';
import Colors from '@/constants/Colors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import MedicineDatabaseUpload from '@/components/inventory/MedicineDatabaseUpload';

// Extend the Medicine interface
interface ExtendedMedicine extends Medicine {
  activeIngredient: string;
  supplier: string;
  effects: string;
  dosageForm: string;
  hazardous: boolean;
  protocol: string;
}

// Sample data for demonstration purposes
const MEDICINES: ExtendedMedicine[] = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Analgesics', price: 5.99, stock: 150, threshold: 20, expiryDate: new Date(2025, 11, 31), manufacturer: 'PharmaCorp', image: 'https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg', activeIngredient: 'Paracetamol', dosageForm: 'Oral', hazardous: false, protocol: 'As needed, max 4g/day', supplier: 'MediSupply', effects: 'Relieves pain and fever' },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 12.49, stock: 8, threshold: 10, expiryDate: new Date(2025, 5, 15), manufacturer: 'MediPharm', image: 'https://images.pexels.com/photos/139398/himalayas-tibet-matterhorn-mountain-139398.jpeg', activeIngredient: 'Amoxicillin', dosageForm: 'Oral', hazardous: false, protocol: '250-500mg every 8 hours', supplier: 'HealthCo', effects: 'Treats bacterial infections' },
  { id: '3', name: 'Aspirin 100mg', category: 'Analgesics', price: 4.25, stock: 200, threshold: 30, expiryDate: new Date(2025, 8, 10), manufacturer: 'PharmaCorp', image: 'https://images.pexels.com/photos/163944/pexels-photo-163944.jpeg', activeIngredient: 'Aspirin', dosageForm: 'Oral', hazardous: false, protocol: '75-325mg once daily', supplier: 'MediSupply', effects: 'Reduces inflammation and pain' },
  { id: '4', name: 'Metformin 500mg', category: 'Antidiabetics', price: 7.99, stock: 5, threshold: 20, expiryDate: new Date(2025, 1, 28), manufacturer: 'DiabeCare', activeIngredient: 'Metformin', dosageForm: 'Oral', hazardous: false, protocol: '500-2000mg daily in divided doses', supplier: 'HealthCo', effects: 'Manages blood sugar' },
];

// Initialize from localStorage if available
const getInitialMedicines = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('medicines');
    if (stored) return JSON.parse(stored);
  }
  return MEDICINES;
};

const getStatus = (item: ExtendedMedicine) => {
  const today = new Date();
  return new Date(item.expiryDate) < today ? 'Expired' : item.stock <= item.threshold ? 'Low' : 'In Stock';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Expired':
      return Colors.danger;
    case 'Low':
      return Colors.warning;
    default:
      return Colors.success;
  }
};

const InventoryTableRow = memo(({ item, onEdit, onDelete, onMarkExpired, onMarkOutOfStock, onShowActiveIngredient, isDeleting }: { item: ExtendedMedicine; onEdit: (item: ExtendedMedicine) => void; onDelete: (item: ExtendedMedicine) => void; onMarkExpired: (item: ExtendedMedicine) => void; onMarkOutOfStock: (item: ExtendedMedicine) => void; onShowActiveIngredient: (ingredient: string) => void; isDeleting: boolean }) => (
  <View style={styles.tableRow}>
    <Text style={styles.cell}>{item.name}</Text>
    <Text style={styles.cell}>{item.category}</Text>
    <Text style={styles.cell}>LE {item.price.toFixed(2)}</Text>
    <Text style={styles.cell}>{item.stock}</Text>
    <View style={styles.cell}>
      <TouchableOpacity onPress={() => onShowActiveIngredient(item.activeIngredient)}>
        <Info size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
    <Text style={styles.cell}>{item.manufacturer}</Text>
    <Text style={styles.cell}>{getStatus(item)}</Text>
    <View style={styles.actionCell}>
      <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => onEdit(item)}>
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(item)} disabled={isDeleting}>
        {isDeleting ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.actionText}>Delete</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.expiredButton]} onPress={() => onMarkExpired(item)}>
        <Text style={styles.actionText}>Expired</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.outOfStockButton]} onPress={() => onMarkOutOfStock(item)}>
        <Text style={styles.actionText}>Out</Text>
      </TouchableOpacity>
    </View>
  </View>
));

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [originalMedicines, setOriginalMedicines] = useState<ExtendedMedicine[]>(getInitialMedicines);
  const [medicines, setMedicines] = useState<ExtendedMedicine[]>(getInitialMedicines);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newMedicine, setNewMedicine] = useState<Partial<ExtendedMedicine>>({ name: '', category: '', price: 0, stock: 0, threshold: 0, expiryDate: new Date(), manufacturer: '', activeIngredient: '', supplier: '', effects: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIngredientModal, setActiveIngredientModal] = useState<{ visible: boolean; ingredient: string }>({ visible: false, ingredient: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExtendedMedicine; direction: 'asc' | 'desc' } | null>(null);
  const [deleting, setDeleting] = useState(false); // Add deleting state
  const itemsPerPage = 5;
  const today = new Date();
  const totalMedicines = medicines.length;
  const lowStockCount = medicines.filter(med => med.stock <= med.threshold).length;
  const expiredCount = medicines.filter(med => new Date(med.expiryDate) < today).length;
  const nearExpiryCount = medicines.filter(med => {
    const expiry = new Date(med.expiryDate);
    const diff = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30;
  }).length;

  // New state and logic for received/dispatched modals
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('');
  const getReportData = () => {
    switch (reportType) {
      case 'total':
        return medicines;
      case 'lowStock':
        return medicines.filter(med => med.stock <= med.threshold);
      case 'expired':
        return medicines.filter(med => new Date(med.expiryDate) < today);
      case 'nearExpiry':
        return medicines.filter(med => {
          const expiry = new Date(med.expiryDate);
          const diff = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
          return diff > 0 && diff <= 30;
        });
      case 'received':
        return medicines.filter(med => med.stock > 0);
      case 'dispatched':
        return medicines.filter(med => med.stock < 200);
      default:
        return [];
    }
  };
  const getReportTitle = () => {
    switch (reportType) {
      case 'total': return 'All Medicines';
      case 'lowStock': return 'Low Stock Medicines';
      case 'expired': return 'Expired Medicines';
      case 'nearExpiry': return 'Near Expiry Medicines';
      case 'received': return 'Received Medicines';
      case 'dispatched': return 'Dispatched Medicines';
      default: return '';
    }
  };

  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const loadMedicines = () => {
      try {
        setTimeout(() => {
          setMedicines(originalMedicines);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load inventory. Please try again.');
        setLoading(false);
      }
    };
    loadMedicines();
  }, [originalMedicines]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = originalMedicines.filter(med =>
        med.name.toLowerCase().includes(text.toLowerCase()) ||
        med.category.toLowerCase().includes(text.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(text.toLowerCase())
      );
      setMedicines(filtered);
    } else {
      setMedicines(originalMedicines);
    }
  };

  const handleSort = (key: keyof ExtendedMedicine) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    const sorted = [...medicines].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setMedicines(sorted);
  };

  const handleItemPress = (item: ExtendedMedicine) => {
    router.push(`/inventory?id=${item.id}`);
  };

  const handleEdit = (item: ExtendedMedicine) => {
    setNewMedicine(item);
    setIsAddModalVisible(true);
  };

  const handleDelete = async (item: ExtendedMedicine) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // First update the UI optimistically
              const updated = originalMedicines.filter(med => med.id !== item.id);
              setOriginalMedicines(updated);
              setMedicines(updated);
              
              // Then update localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('medicines', JSON.stringify(updated));
              }
              
              // Show success message
              Alert.alert('Success', `${item.name} has been deleted successfully.`);
              
              // Reset current page if needed
              const totalPages = Math.ceil(updated.length / itemsPerPage);
              if (currentPage > totalPages) {
                setCurrentPage(Math.max(1, totalPages));
              }
            } catch (err) {
              // Revert changes if there's an error
              setOriginalMedicines(originalMedicines);
              setMedicines(originalMedicines);
              Alert.alert('Error', 'Failed to delete the medicine. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveMedicine = () => {
    if (!newMedicine.name || !newMedicine.category || !newMedicine.manufacturer || 
        !newMedicine.activeIngredient || !newMedicine.supplier || !newMedicine.effects || 
        !newMedicine.price || newMedicine.price <= 0 || 
        !newMedicine.stock || newMedicine.stock < 0 || 
        !newMedicine.threshold || newMedicine.threshold < 0 || 
        !newMedicine.expiryDate) {
      Alert.alert('Error', 'Please fill all required fields with valid values.');
      return;
    }
    const isEditing = !!newMedicine.id;
    const updated = isEditing
      ? medicines.map(med => med.id === newMedicine.id ? { ...newMedicine, id: med.id } as ExtendedMedicine : med)
      : [{ id: (originalMedicines.length + 1).toString(), ...newMedicine } as ExtendedMedicine, ...medicines];
    setMedicines(updated);
    setOriginalMedicines(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medicines', JSON.stringify(updated));
    }
    Alert.alert('Success', `${newMedicine.name} ${isEditing ? 'updated' : 'added'}.`);
    setNewMedicine({ name: '', category: '', price: 0, stock: 0, threshold: 0, expiryDate: new Date(), manufacturer: '', activeIngredient: '', supplier: '', effects: '' });
    setIsAddModalVisible(false);
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({ value: newMedicine.expiryDate || new Date(), onChange: (event, date) => date && setNewMedicine({ ...newMedicine, expiryDate: date }), mode: 'date', display: 'spinner' });
  };

  const markAsExpired = (item: ExtendedMedicine) => {
    const updated = medicines.map(med => med.id === item.id ? { ...med, stock: 0, expiryDate: new Date(2016, 1, 1) } : med);
    setMedicines(updated);
    setOriginalMedicines(updated);
    Alert.alert('Success', `${item.name} marked as expired.`);
  };

  const markAsOutOfStock = (item: ExtendedMedicine) => {
    const updated = medicines.map(med => med.id === item.id ? { ...med, stock: 0 } : med);
    setMedicines(updated);
    setOriginalMedicines(updated);
    Alert.alert('Success', `${item.name} marked as out of stock.`);
  };

  const showActiveIngredientDetails = (ingredient: string) => {
    setActiveIngredientModal({ visible: true, ingredient });
  };

  const paginatedMedicines = medicines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderItem = useCallback(({ item }: { item: ExtendedMedicine }) => (
    <InventoryTableRow
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onMarkExpired={markAsExpired}
      onMarkOutOfStock={markAsOutOfStock}
      onShowActiveIngredient={showActiveIngredientDetails}
      isDeleting={deleting}
    />
  ), [medicines, deleting]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No medicines found</Text>
      <Button title="Add New Medicine" onPress={() => setIsAddModalVisible(true)} variant="primary" style={styles.addButtonSpacing} />
    </View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading inventory...</Text>
    </View>
  );
  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <Button title="Retry" onPress={() => setMedicines(originalMedicines)} variant="primary" style={styles.retryButton} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Inventory" />
      
      <View style={styles.content}>
        {showUpload && <MedicineDatabaseUpload onSuccess={() => setShowUpload(false)} />}
        
        <View style={styles.headerRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          <View style={styles.buttonGroup}>
            <Button 
              title="Import CSV" 
              onPress={() => setShowUpload(true)} 
              variant="outline" 
              style={styles.importButton} 
            />
            <Button 
              title="Add Medicine" 
              icon={<Plus size={20} />} 
              onPress={() => setIsAddModalVisible(true)} 
              variant="primary" 
              style={styles.addButton} 
            />
          </View>
        </View>
        {/* Medicine Overview Cards (now under search bar) */}
        <View style={styles.overviewRow}>
          <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#A3D8F4', elevation: 3 }]} onPress={() => { setReportType('lowStock'); setReportModalVisible(true); }}>
            <Package size={20} color="#fff" style={styles.overviewIcon} />
            <Text style={styles.overviewLabelContrast}>Low Stock Medicines</Text>
            <Text style={styles.overviewValueContrast}>{lowStockCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#FF7F7F', elevation: 3 }]} onPress={() => { setReportType('expired'); setReportModalVisible(true); }}>
            <AlertCircle size={20} color="#fff" style={styles.overviewIcon} />
            <Text style={styles.overviewLabelContrast}>Expired Medicines</Text>
            <Text style={styles.overviewValueContrast}>{expiredCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#3EC6C1', elevation: 3 }]} onPress={() => { setReportType('nearExpiry'); setReportModalVisible(true); }}>
            <Archive size={20} color="#fff" style={styles.overviewIcon} />
            <Text style={styles.overviewLabelContrast}>Near. Expiry Medicines</Text>
            <Text style={styles.overviewValueContrast}>{nearExpiryCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#6EE7B7', elevation: 3 }]} onPress={() => { setReportType('received'); setReportModalVisible(true); }}>
            <ArrowDown size={20} color="#fff" style={styles.overviewIcon} />
            <Text style={styles.overviewLabelContrast}>Total Received</Text>
            <Text style={styles.overviewValueContrast}>{medicines.filter(med => med.stock > 0).length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#A78BFA', elevation: 3 }]} onPress={() => { setReportType('dispatched'); setReportModalVisible(true); }}>
            <ArrowUp size={20} color="#fff" style={styles.overviewIcon} />
            <Text style={styles.overviewLabelContrast}>Total Dispatched</Text>
            <Text style={styles.overviewValueContrast}>{medicines.filter(med => med.stock < 200).length}</Text>
          </TouchableOpacity>
        </View>
        {/* End Medicine Overview Cards */}
        <Card style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Category</Text>
            <Text style={styles.headerCell}>Price</Text>
            <Text style={styles.headerCell}>Stock</Text>
            <Text style={styles.headerCell}>Info</Text>
            <Text style={styles.headerCell}>Company</Text>
            <Text style={styles.headerCell}>Status</Text>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>Actions</Text>
          </View>
          <FlatList
            data={paginatedMedicines}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tableContent}
            ListEmptyComponent={renderEmptyList}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
            showsVerticalScrollIndicator={true}
          />
          {medicines.length > itemsPerPage && (
            <View style={styles.pagination}>
              <Button title="Prev" variant="outline" onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={styles.paginationButton} />
              <Button title="Next" variant="outline" onPress={() => setCurrentPage(prev => (prev * itemsPerPage < medicines.length ? prev + 1 : prev))} disabled={currentPage * itemsPerPage >= medicines.length} style={styles.paginationButton} />
            </View>
          )}
        </Card>
      </View>

      {/* Add/Edit Medicine Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapperFixed}>
            <Card style={styles.modalCardFixed}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{newMedicine.id ? 'Edit Medicine' : 'Add New Medicine'}</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalFlexBody}>
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.modalContentContainer}
                  showsVerticalScrollIndicator={true}
                  scrollIndicatorInsets={{ right: 0 }}
                >
                  <View style={styles.formContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.name} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, name: text })} 
                      placeholder="e.g., Paracetamol 500mg"
                    />
                    <Text style={styles.label}>Category</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.category} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, category: text })} 
                      placeholder="e.g., Analgesics"
                    />
                    <Text style={styles.label}>Price (LE)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.price?.toString()} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, price: parseFloat(text) || 0 })} 
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.label}>Stock Quantity</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.stock?.toString()} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, stock: parseInt(text) || 0 })} 
                      keyboardType="numeric"
                    />
                    <Text style={styles.label}>Threshold</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.threshold?.toString()} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, threshold: parseInt(text) || 0 })} 
                      keyboardType="numeric"
                    />
                    <Text style={styles.label}>Expiry Date</Text>
                    <TouchableOpacity style={styles.input} onPress={showDatePicker}>
                      <Text style={styles.inputText}>{newMedicine.expiryDate?.toLocaleDateString() || 'Select Date'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.label}>Manufacturer</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.manufacturer} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, manufacturer: text })} 
                      placeholder="e.g., PharmaCorp"
                    />
                    <Text style={styles.label}>Active Ingredient</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.activeIngredient} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, activeIngredient: text })} 
                      placeholder="e.g., Paracetamol"
                    />
                    <Text style={styles.label}>Supplier</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.supplier} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, supplier: text })} 
                      placeholder="e.g., MediSupply"
                    />
                    <Text style={styles.label}>Effects</Text>
                    <TextInput 
                      style={styles.input} 
                      value={newMedicine.effects} 
                      onChangeText={text => setNewMedicine({ ...newMedicine, effects: text })} 
                      placeholder="e.g., Relieves pain"
                    />
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <Button 
                    title={newMedicine.id ? 'Update' : 'Save'} 
                    variant="primary" 
                    onPress={handleSaveMedicine} 
                    style={styles.saveButton} 
                  />
                </View>
              </View>
            </Card>
          </View>
        </View>
      </Modal>

      {/* Active Ingredient Modal */}
      <Modal
        visible={activeIngredientModal.visible}
        animationType="slide"
        onRequestClose={() => setActiveIngredientModal({ ...activeIngredientModal, visible: false })}
        transparent
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveIngredientModal({ ...activeIngredientModal, visible: false })}>
          <View style={styles.modalContentWrapperFixed}>
            <Card style={styles.modalCardFixed}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Medications with {activeIngredientModal.ingredient}</Text>
                <TouchableOpacity onPress={() => setActiveIngredientModal({ ...activeIngredientModal, visible: false })}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={styles.modalBody} 
                contentContainerStyle={styles.modalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {medicines.filter(med => med.activeIngredient === activeIngredientModal.ingredient).map(med => (
                  <View key={med.id} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>{med.name}</Text>
                    <Text style={styles.ingredientText}>{`${med.dosageForm} ${med.name}`}</Text>
                    <Text style={styles.ingredientText}>{`In Stock: ${med.stock}`}</Text>
                  </View>
                ))}
              </ScrollView>
            </Card>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unified Report Modal */}
      <Modal visible={reportModalVisible} animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.gray[50], padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.primary, marginBottom: 16 }}>{getReportTitle()}</Text>
          <FlatList
            data={getReportData()}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, elevation: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                <Text>Category: {item.category}</Text>
                <Text>Price: LE {item.price.toFixed(2)}</Text>
                <Text>Stock: {item.stock}</Text>
                <Text>Expiry: {item.expiryDate.toLocaleDateString()}</Text>
                <Text>Manufacturer: {item.manufacturer}</Text>
              </View>
            )}
            ListEmptyComponent={<Text>No medicines found.</Text>}
          />
          <Button title="Close" onPress={() => setReportModalVisible(false)} style={{ marginTop: 16 }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.gray[50],
    width: '100%'
  },
  content: { 
    flex: 1, 
    padding: 20,
    width: '100%'
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gray[50] },
  loadingText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.gray[700], marginTop: 12 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.danger, textAlign: 'center', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 16, height: 48, elevation: 2, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  searchInput: { flex: 1, height: '100%', marginLeft: 12, fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.gray[800] },
  addButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, elevation: 3 },
  addButtonSpacing: { marginTop: 20 },
  retryButton: { marginTop: 20 },
  tableCard: { 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    padding: 12, 
    elevation: 4, 
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6,
    width: '100%'
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: Colors.gray[100], 
    paddingVertical: 12, 
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12,
    width: '100%'
  },
  headerCell: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 8,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center'
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.gray[200], 
    backgroundColor: Colors.white, 
    borderRadius: 8, 
    marginBottom: 8, 
    elevation: 1,
    width: '100%'
  },
  cell: { 
    flex: 1, 
    fontFamily: 'Inter-Regular', 
    fontSize: 14, 
    color: Colors.gray[900], 
    textAlign: 'center', 
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  actionCell: { 
    flex: 1.2, // slightly wider for actions
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 4,
    paddingHorizontal: 4
  },
  actionButton: { 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 4, 
    elevation: 2,
    width: '100%',
    alignItems: 'center'
  },
  actionText: { 
    fontFamily: 'Inter-Medium', 
    fontSize: 10, 
    color: Colors.white 
  },
  editButton: { 
    backgroundColor: Colors.primary 
  },
  deleteButton: { 
    backgroundColor: Colors.danger 
  },
  expiredButton: { 
    backgroundColor: Colors.danger 
  },
  outOfStockButton: { 
    backgroundColor: Colors.danger 
  },
  statusBadge: { flex: 1, justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  statusText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.white, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  paginationText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.gray[600], textAlign: 'center', marginVertical: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  paginationButton: { paddingVertical: 8, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { fontFamily: 'Inter-Medium', fontSize: 18, color: Colors.gray[500], textAlign: 'center', marginBottom: 20 },
  modalContentWrapperFixed: {
    width: '100%',
    maxHeight: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardFixed: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 0,
    flex: 1,
    width: '100%',
    maxHeight: '100%',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  modalFlexBody: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.gray[50] },
  modalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 24, color: Colors.primary },
  closeText: { fontFamily: 'Inter-Bold', fontSize: 20, color: Colors.gray[700] },
  modalBody: { 
    flex: 1,
    width: '100%',
    maxHeight: '80%'
  },
  scrollView: {
    flex: 1,
    width: '100%'
  },
  modalContentContainer: { 
    flexGrow: 1,
    padding: 20
  },
  formContainer: {
    width: '100%',
    paddingBottom: 40
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    maxWidth: 200
  },
  label: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.gray[700], marginBottom: 8 },
  input: { backgroundColor: Colors.gray[100], borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.gray[300], fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.gray[900] },
  inputText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.gray[900] },
  ingredientItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  ingredientText: { fontFamily: 'Inter-Regular', fontSize: 16, color: Colors.gray[800], marginBottom: 4 },
  tableContent: { flexGrow: 1 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 16 },
  alertText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.white, marginLeft: 6 },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    elevation: 1,
  },
  overviewIcon: {
    marginBottom: 4,
  },
  overviewLabelContrast: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  overviewValueContrast: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});