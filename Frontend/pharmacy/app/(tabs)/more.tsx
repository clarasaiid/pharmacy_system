import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, FlatList, TextInput, ActivityIndicator, useColorScheme } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Truck, Settings, ChartBar as BarChart3, ChevronRight, Bell, CircleUser, HelpCircle, LogOut, Clipboard, Box, Shield, Book, Moon, X, Mail, Phone, Package, Calendar, AlertCircle, ChevronDown, ChevronUp, Trash2, Globe, Lock } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Colors from '@/constants/Colors';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  prescriptions: { medication: string; date: string; refills: number }[];
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  orders: { medication: string; quantity: number; status: string }[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expirationDate: string;
  lowStock: boolean;
}

interface Profile {
  name: string;
  role: string;
  license: string;
  branch: string;
}

interface SalesData {
  date: string;
  amount: number;
  category: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

const MenuItem = React.memo(({ icon, title, subtitle, onPress, showBadge = false }: MenuItemProps) => (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={title}
      accessibilityHint={`Navigates to ${title} screen`}
    >
      <View style={styles.menuIconContainer}>
        {icon}
        {showBadge && <View style={styles.badge} />}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={Colors.gray[400]} />
    </TouchableOpacity>
));

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    name: 'Dr. Mohamed Ahmed',
    role: 'Pharmacy Manager',
    license: 'RPH-12345',
    branch: 'Downtown',
  });
  const [language, setLanguage] = useState('en'); // 'en' for English, 'ar' for Arabic

  // State for modals and sections
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);
  const [addSupplierModalVisible, setAddSupplierModalVisible] = useState(false);
  const [addInventoryModalVisible, setAddInventoryModalVisible] = useState(false);
  const [addPrescriptionModalVisible, setAddPrescriptionModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isManagementExpanded, setIsManagementExpanded] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newInventoryName, setNewInventoryName] = useState('');
  const [newInventoryQuantity, setNewInventoryQuantity] = useState('');
  const [newInventoryExpiration, setNewInventoryExpiration] = useState('');
  const [newPrescriptionCustomerId, setNewPrescriptionCustomerId] = useState('');
  const [newPrescriptionMedication, setNewPrescriptionMedication] = useState('');
  const [newPrescriptionDate, setNewPrescriptionDate] = useState('');
  const [newPrescriptionRefills, setNewPrescriptionRefills] = useState('');
  const [editName, setEditName] = useState(profile.name);
  const [editRole, setEditRole] = useState(profile.role);
  const [editLicense, setEditLicense] = useState(profile.license);
  const [editBranch, setEditBranch] = useState(profile.branch);

  // Sample data
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Alice Johnson', phone: '555-123-4567', prescriptions: [{ medication: 'Amoxicillin', date: '2025-04-01', refills: 2 }] },
    { id: '2', name: 'Bob Smith', phone: '555-987-6543', prescriptions: [{ medication: 'Lisinopril', date: '2025-03-15', refills: 1 }] },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', name: 'MediSupply Co.', contact: 'contact@medisupply.com', orders: [{ medication: 'Ibuprofen', quantity: 500, status: 'Delivered' }] },
    { id: '2', name: 'PharmaDistributors', contact: 'support@pharmadist.com', orders: [{ medication: 'Paracetamol', quantity: 1000, status: 'Pending' }] },
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', name: 'Ibuprofen 200mg', quantity: 150, expirationDate: '2025-12-31', lowStock: false },
    { id: '2', name: 'Paracetamol 500mg', quantity: 20, expirationDate: '2025-06-30', lowStock: true },
  ]);

  const [salesData, setSalesData] = useState<SalesData[]>([
    { date: '2025-01', amount: 5000, category: 'Prescriptions' },
    { date: '2025-02', amount: 6000, category: 'Prescriptions' },
    { date: '2025-03', amount: 7500, category: 'Prescriptions' },
    { date: '2025-04', amount: 7000, category: 'Prescriptions' },
    { date: '2025-05', amount: 8000, category: 'Over-the-Counter' },
  ]);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Low Stock Alert', message: 'Paracetamol 500mg is running low (20 units left).', date: '2025-05-19 01:30 AM', isRead: false },
    { id: '2', title: 'Supplier Update', message: 'MediSupply Co. has delivered 500 units of Ibuprofen.', date: '2025-05-18 10:00 AM', isRead: false },
    { id: '3', title: 'Prescription Reminder', message: "Alice Johnson's Amoxicillin refill is due today.", date: '2025-05-17 09:00 AM', isRead: true },
  ]);

  // Add state for modals
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [changeEmailModalVisible, setChangeEmailModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleManagement = () => setIsManagementExpanded(!isManagementExpanded);
  const toggleSettings = () => setIsSettingsExpanded(!isSettingsExpanded);
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  const handleAddCustomer = () => {
    if (newCustomerName && newCustomerPhone) {
      setIsLoading(true);
      setTimeout(() => {
        const newCustomer: Customer = {
          id: (customers.length + 1).toString(),
          name: newCustomerName,
          phone: newCustomerPhone,
          prescriptions: [],
        };
        setCustomers([...customers, newCustomer]);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setAddCustomerModalVisible(false);
        setIsLoading(false);
      }, 1000); // Simulate API call
    }
  };

  const handleAddSupplier = () => {
    if (newSupplierName && newSupplierContact) {
      setIsLoading(true);
      setTimeout(() => {
        const newSupplier: Supplier = {
          id: (suppliers.length + 1).toString(),
          name: newSupplierName,
          contact: newSupplierContact,
          orders: [],
        };
        setSuppliers([...suppliers, newSupplier]);
        setNewSupplierName('');
        setNewSupplierContact('');
        setAddSupplierModalVisible(false);
        setIsLoading(false);
      }, 1000); // Simulate API call
    }
  };

  const handleAddInventory = () => {
    if (newInventoryName && newInventoryQuantity && newInventoryExpiration) {
      setIsLoading(true);
      setTimeout(() => {
        const newItem: InventoryItem = {
          id: (inventory.length + 1).toString(),
          name: newInventoryName,
          quantity: parseInt(newInventoryQuantity),
          expirationDate: newInventoryExpiration,
          lowStock: parseInt(newInventoryQuantity) < 50,
        };
        setInventory([...inventory, newItem]);
        setNewInventoryName('');
        setNewInventoryQuantity('');
        setNewInventoryExpiration('');
        setAddInventoryModalVisible(false);
        setIsLoading(false);
      }, 1000); // Simulate API call
    }
  };

  const handleAddPrescription = () => {
    if (newPrescriptionCustomerId && newPrescriptionMedication && newPrescriptionDate && newPrescriptionRefills) {
      setIsLoading(true);
      setTimeout(() => {
        const customer = customers.find(c => c.id === newPrescriptionCustomerId);
        if (customer) {
          const updatedCustomers = customers.map(c =>
            c.id === customer.id
              ? {
                  ...c,
                  prescriptions: [
                    ...c.prescriptions,
                    { medication: newPrescriptionMedication, date: newPrescriptionDate, refills: parseInt(newPrescriptionRefills) },
                  ],
                }
              : c
          );
          setCustomers(updatedCustomers);
          setNewPrescriptionCustomerId('');
          setNewPrescriptionMedication('');
          setNewPrescriptionDate('');
          setNewPrescriptionRefills('');
          setAddPrescriptionModalVisible(false);
        }
        setIsLoading(false);
      }, 1000); // Simulate API call
    }
  };

  const handleSaveProfile = () => {
    setProfile({ name: editName, role: editRole, license: editLicense, branch: editBranch });
    setEditProfileModalVisible(false);
  };

  const handleExportReport = () => console.log('Exporting report as PDF');

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread notifications for badge
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const filteredMenuItems = useMemo(() => {
    const managementItems = [
      { icon: <Users size={24} color={Colors.primary} />, title: language === 'en' ? 'Customer Management' : 'إدارة العملاء', subtitle: language === 'en' ? 'View and manage customer profiles' : 'عرض وإدارة ملفات العملاء', onPress: () => router.push('/customer-management') },
      { icon: <Truck size={24} color={Colors.secondary} />, title: language === 'en' ? 'Supplier Management' : 'إدارة الموردين', subtitle: language === 'en' ? 'Manage suppliers and orders' : 'إدارة الموردين والطلبات', onPress: () => setSupplierModalVisible(true), showBadge: true },
    ];

    const settingsItems = [
      { icon: <Settings size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />, title: language === 'en' ? 'Settings' : 'الإعدادات', subtitle: language === 'en' ? 'App preferences and account settings' : 'تفضيلات التطبيق وإعدادات الحساب', onPress: () => setSettingsModalVisible(true) },
      { icon: <Bell size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />, title: language === 'en' ? 'Notifications' : 'الإشعارات', subtitle: language === 'en' ? 'Manage your notification preferences' : 'إدارة تفضيلات الإشعارات الخاصة بك', onPress: () => setNotificationsModalVisible(true), showBadge: unreadNotificationsCount > 0 },
      { icon: <Moon size={24} color={theme === 'light' ? '#34495E' : '#ECF0F1'} />, title: language === 'en' ? 'Theme' : 'الثيم', subtitle: language === 'en' ? `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode` : `التحول إلى ${theme === 'light' ? 'داكن' : 'فاتح'}`, onPress: toggleTheme },
      { icon: <Globe size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />, title: language === 'en' ? 'Language' : 'اللغة', subtitle: language === 'en' ? `Switch to ${language === 'en' ? 'Arabic' : 'English'}` : `التحول إلى ${language === 'en' ? 'العربية' : 'الإنجليزية'}`, onPress: toggleLanguage },
    ];

    return {
      management: managementItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())),
      settings: settingsItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    };
  }, [searchQuery, theme, unreadNotificationsCount, language]);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
      <Header title={language === 'en' ? 'More' : 'المزيد'} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <CircleUser size={64} color={theme === 'light' ? Colors.gray[400] : Colors.gray[200]} />
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{profile.name}</Text>
            <Text style={[styles.profileRole, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{profile.role}</Text>
            <Text style={[styles.profileDetail, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'License:' : 'الرخصة:'} {profile.license}</Text>
            <Text style={[styles.profileDetail, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'Branch:' : 'الفرع:'} {profile.branch}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditProfileModalVisible(true)}>
            <Text style={styles.editButtonText}>{language === 'en' ? 'Edit Profile' : 'تعديل الملف الشخصي'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Management Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={toggleManagement}>
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Management' : 'الإدارة'}</Text>
            {isManagementExpanded ? <ChevronUp size={20} color={theme === 'light' ? '#1A3C6D' : '#ECF0F1'} /> : <ChevronDown size={20} color={theme === 'light' ? '#1A3C6D' : '#ECF0F1'} />}
          </TouchableOpacity>
          {isManagementExpanded && filteredMenuItems.management.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>
        
        {/* Settings & Support Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={toggleSettings}>
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Settings & Support' : 'الإعدادات والدعم'}</Text>
            {isSettingsExpanded ? <ChevronUp size={20} color={theme === 'light' ? '#1A3C6D' : '#ECF0F1'} /> : <ChevronDown size={20} color={theme === 'light' ? '#1A3C6D' : '#ECF0F1'} />}
          </TouchableOpacity>
          {isSettingsExpanded && filteredMenuItems.settings.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => router.replace('/login')}
          accessibilityLabel={language === 'en' ? 'Logout' : 'تسجيل الخروج'}
          accessibilityHint={language === 'en' ? 'Logs out of the application' : 'يغلق الجلسة من التطبيق'}
        >
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{language === 'en' ? 'Logout' : 'تسجيل الخروج'}</Text>
        </TouchableOpacity>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'Version 1.0.0' : 'الإصدار 1.0.0'}</Text>
          <TouchableOpacity onPress={() => console.log('Open Privacy Policy')}>
            <Text style={styles.legalText}>{language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Open Terms of Service')}>
            <Text style={styles.legalText}>{language === 'en' ? 'Terms of Service' : 'شروط الخدمة'}</Text>
          </TouchableOpacity>
          <Text style={[styles.contactText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'Contact:' : 'اتصل بنا:'} support@pharmacyapp.com</Text>
        </View>
      </ScrollView>

      {/* Supplier Management Modal */}
      <Modal visible={supplierModalVisible} animationType="slide" onRequestClose={() => { setSupplierModalVisible(false); setSelectedSupplier(null); }}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Supplier Management' : 'إدارة الموردين'}</Text>
            <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
          ) : selectedSupplier ? (
            <View style={styles.modalContent}>
              <Text style={[styles.modalSubtitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{selectedSupplier.name}</Text>
              <View style={styles.detailRow}>
                <Mail size={20} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
                <Text style={[styles.detailText, { color: theme === 'light' ? Colors.gray[600] : Colors.gray[200] }]}>{selectedSupplier.contact}</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1', marginTop: 16 }]}>{language === 'en' ? 'Order History' : 'سجل الطلبات'}</Text>
              <FlatList
                data={selectedSupplier.orders}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.listItem}>
                    <Text style={[styles.listItemText, { color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}>{item.medication}</Text>
                    <Text style={[styles.listItemSubText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'Quantity:' : 'الكمية:'} {item.quantity}</Text>
                    <Text style={[styles.listItemSubText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{language === 'en' ? 'Status:' : 'الحالة:'} {item.status}</Text>
                  </View>
                )}
              />
              <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Place New Order')}>
                <Package size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>{language === 'en' ? 'Place New Order' : 'إضافة طلب جديد'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={() => setSelectedSupplier(null)}>
                <Text style={styles.backButtonText}>{language === 'en' ? 'Back to List' : 'العودة إلى القائمة'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.modalContent}>
              <TextInput
                style={[styles.searchInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Search suppliers...' : 'ابحث عن الموردين...'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              />
              <FlatList
                data={suppliers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => setSelectedSupplier(item)}>
                    <Text style={[styles.listItemText, { color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}>{item.name}</Text>
                    <Text style={[styles.listItemSubText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{item.contact}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.actionButton} onPress={() => setAddSupplierModalVisible(true)}>
                <Text style={styles.actionButtonText}>{language === 'en' ? 'Add New Supplier' : 'إضافة مورد جديد'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal visible={addSupplierModalVisible} animationType="slide" onRequestClose={() => setAddSupplierModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Add New Supplier' : 'إضافة مورد جديد'}</Text>
            <TouchableOpacity onPress={() => setAddSupplierModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
          ) : (
            <View style={styles.modalContent}>
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Supplier Name' : 'اسم المورد'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={newSupplierName}
                onChangeText={setNewSupplierName}
              />
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Contact Email' : 'البريد الإلكتروني للتواصل'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={newSupplierContact}
                onChangeText={setNewSupplierContact}
                keyboardType="email-address"
              />
              <TouchableOpacity style={styles.actionButton} onPress={handleAddSupplier}>
                <Text style={styles.actionButtonText}>{language === 'en' ? 'Save Supplier' : 'حفظ المورد'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notificationsModalVisible} animationType="slide" onRequestClose={() => setNotificationsModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Notifications' : 'الإشعارات'}</Text>
            <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {notifications.length === 0 ? (
              <Text style={[styles.listItemText, { color: theme === 'light' ? Colors.gray[800] : Colors.gray[200], textAlign: 'center' }]}>{language === 'en' ? 'No notifications available.' : 'لا توجد إشعارات متاحة.'}</Text>
            ) : (
              <>
                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.listItem, { backgroundColor: item.isRead ? (theme === 'light' ? Colors.gray[100] : Colors.gray[700]) : (theme === 'light' ? Colors.white : Colors.gray[600]) }]}>
                      <View style={styles.notificationContent}>
                        <Text style={[styles.listItemText, { color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}>{item.title}</Text>
                        <Text style={[styles.listItemSubText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{item.message}</Text>
                        <Text style={[styles.listItemSubText, { color: theme === 'light' ? Colors.gray[500] : Colors.gray[300] }]}>{item.date}</Text>
                      </View>
                      {!item.isRead && (
                        <TouchableOpacity style={styles.markAsReadButton} onPress={() => handleMarkAsRead(item.id)}>
                          <Text style={styles.markAsReadText}>{language === 'en' ? 'Mark as Read' : 'وضع علامة كمقروء'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
                <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAllNotifications}>
                  <Trash2 size={20} color={Colors.danger} />
                  <Text style={styles.clearAllButtonText}>{language === 'en' ? 'Clear All' : 'مسح الكل'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModalVisible} animationType="slide" onRequestClose={() => setEditProfileModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Edit Profile' : 'تعديل الملف الشخصي'}</Text>
            <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>
          ) : (
            <View style={styles.modalContent}>
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Name' : 'الاسم'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Role' : 'الدور'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={editRole}
                onChangeText={setEditRole}
              />
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'License' : 'الرخصة'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={editLicense}
                onChangeText={setEditLicense}
              />
              <TextInput
                style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
                placeholder={language === 'en' ? 'Branch' : 'الفرع'}
                placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
                value={editBranch}
                onChangeText={setEditBranch}
              />
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveProfile}>
                <Text style={styles.actionButtonText}>{language === 'en' ? 'Save Profile' : 'حفظ الملف الشخصي'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordModalVisible} animationType="slide" onRequestClose={() => setChangePasswordModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Change Password' : 'تغيير كلمة المرور'}</Text>
            <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
              placeholder={language === 'en' ? 'Current Password' : 'كلمة المرور الحالية'}
              placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
              placeholder={language === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
              placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
              placeholder={language === 'en' ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}
              placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.actionButton} onPress={() => {/* handle password change */}}>
              <Text style={styles.actionButtonText}>{language === 'en' ? 'Save Password' : 'حفظ كلمة المرور'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Email Modal */}
      <Modal visible={changeEmailModalVisible} animationType="slide" onRequestClose={() => setChangeEmailModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Change Email' : 'تغيير البريد الإلكتروني'}</Text>
            <TouchableOpacity onPress={() => setChangeEmailModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
              placeholder={language === 'en' ? 'Current Email' : 'البريد الإلكتروني الحالي'}
              placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              value={currentEmail}
              onChangeText={setCurrentEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.formInput, { borderColor: theme === 'light' ? Colors.gray[300] : Colors.gray[500], color: theme === 'light' ? Colors.gray[800] : Colors.gray[200] }]}
              placeholder={language === 'en' ? 'New Email' : 'البريد الإلكتروني الجديد'}
              placeholderTextColor={theme === 'light' ? Colors.gray[500] : Colors.gray[300]}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.actionButton} onPress={() => {/* handle email change */}}>
              <Text style={styles.actionButtonText}>{language === 'en' ? 'Save Email' : 'حفظ البريد الإلكتروني'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#F7F9FC' : '#1A2525' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1A3C6D' : '#ECF0F1' }]}>{language === 'en' ? 'Settings' : 'الإعدادات'}</Text>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <X size={24} color={theme === 'light' ? Colors.gray[600] : Colors.gray[200]} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {/* App preferences/account settings content can go here */}
            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsModalVisible(false); setChangePasswordModalVisible(true); }}>
              <Lock size={24} color={Colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.menuTitle}>{language === 'en' ? 'Change Password' : 'تغيير كلمة المرور'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsModalVisible(false); setChangeEmailModalVisible(true); }}>
              <Mail size={24} color={Colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.menuTitle}>{language === 'en' ? 'Change Email' : 'تغيير البريد الإلكتروني'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  profileSection: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginVertical: 16,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  profileImageContainer: { marginRight: 16 },
  profileImage: { width: 64, height: 64, borderRadius: 32 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 4 },
  profileRole: { fontFamily: 'Inter-Regular', fontSize: 14, marginBottom: 4 },
  profileDetail: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 },
  editButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#3498DB', borderRadius: 8 },
  editButtonText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.white },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
  sectionTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 16, marginLeft: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 12, marginBottom: 10, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 1,
  },
  menuIconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  badge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4D4F', borderWidth: 1, borderColor: Colors.white },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#1A3C6D', marginBottom: 2 },
  menuSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.gray[500] },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, marginTop: 12, marginBottom: 16,
  },
  logoutText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.danger, marginLeft: 8 },
  footer: { alignItems: 'center', marginBottom: 20 },
  versionText: { fontFamily: 'Inter-Regular', fontSize: 12 },
  legalText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#3498DB', marginTop: 8 },
  contactText: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 8 },
  searchInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontFamily: 'Inter-Regular', fontSize: 16 },
  formInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontFamily: 'Inter-Regular', fontSize: 16 },
  listItem: {
    padding: 16, backgroundColor: Colors.white, borderRadius: 12, marginBottom: 8, shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1, flexDirection: 'row', alignItems: 'center',
  },
  notificationContent: { flex: 1 },
  listItemText: { fontFamily: 'Inter-Medium', fontSize: 16, marginBottom: 4 },
  listItemSubText: { fontFamily: 'Inter-Regular', fontSize: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontFamily: 'Inter-Regular', fontSize: 14, marginLeft: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3498DB', borderRadius: 12, padding: 12, marginTop: 16 },
  actionButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.white, marginLeft: 8 },
  backButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray[200], borderRadius: 12, padding: 12, marginTop: 8 },
  backButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.gray[800] },
  markAsReadButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#3498DB', borderRadius: 8 },
  markAsReadText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.white },
  clearAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: Colors.danger },
  clearAllButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.danger, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, paddingTop: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  modalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 20 },
  modalSubtitle: { fontFamily: 'Inter-Medium', fontSize: 18, marginBottom: 12 },
  modalContent: { padding: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, padding: 16, backgroundColor: Colors.white, borderRadius: 12, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 14, marginBottom: 4 },
  statValue: { fontFamily: 'Inter-SemiBold', fontSize: 18 },
});