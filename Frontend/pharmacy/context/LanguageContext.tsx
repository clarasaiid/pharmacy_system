import React, { createContext, ReactNode } from 'react';

// English translations
const translations = {
  more: 'More',
  searchMenuItems: 'Search menu items...',
  management: 'Management',
  settingsAndSupport: 'Settings & Support',
  customerManagement: 'Customer Management',
  supplierManagement: 'Supplier Management',
  inventoryManagement: 'Inventory Management',
  prescriptionManagement: 'Prescription Management',
  reportsAndAnalytics: 'Reports & Analytics',
  settings: 'Settings',
  notifications: 'Notifications',
  complianceAndRegulations: 'Compliance & Regulations',
  customerSupportPortal: 'Customer Support Portal',
  professionalDevelopment: 'Professional Development',
  theme: 'Theme',
  language: 'Language',
  viewAndManageCustomerProfiles: 'View and manage customer profiles',
  manageSuppliersAndOrders: 'Manage suppliers and orders',
  trackStockLevels: 'Track stock levels and expiration dates',
  viewAndProcessPrescriptions: 'View and process customer prescriptions',
  viewSalesAndInventoryReports: 'View sales and inventory reports',
  appPreferences: 'App preferences and account settings',
  manageNotifications: 'Manage your notification preferences',
  accessDEAGuidelines: 'Access DEA and state pharmacy guidelines',
  faqsAndSupport: 'FAQs, live chat, and support tickets',
  accessCECourses: 'Access CE courses and certifications',
  switchToDark: 'Switch to Dark Mode',
  switchToLight: 'Switch to Light Mode',
  logout: 'Logout',
  logsOut: 'Logs out of the application',
  version: 'Version 1.0.0',
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  contact: 'Contact: support@pharmacyapp.com',
  license: 'License:',
  branch: 'Branch:',
  editProfile: 'Edit Profile',
  addNewCustomer: 'Add New Customer',
  customerName: 'Customer Name',
  phoneNumber: 'Phone Number',
  saveCustomer: 'Save Customer',
  searchCustomers: 'Search customers...',
  prescriptionHistory: 'Prescription History',
  date: 'Date:',
  refills: 'Refills:',
  sendReminder: 'Send Reminder',
  backToList: 'Back to List',
  addNewSupplier: 'Add New Supplier',
  supplierName: 'Supplier Name',
  contactEmail: 'Contact Email',
  saveSupplier: 'Save Supplier',
  searchSuppliers: 'Search suppliers...',
  orderHistory: 'Order History',
  quantity: 'Quantity:',
  status: 'Status:',
  placeNewOrder: 'Place New Order',
  searchInventory: 'Search inventory...',
  qty: 'Qty:',
  lowStock: 'Low Stock',
  addNewItem: 'Add New Item',
  expiration: 'Expiration:',
  lowStockAlert: 'Low Stock Alert',
  requestRestock: 'Request Restock',
  addNewPrescription: 'Add New Prescription',
  customerId: 'Customer ID',
  medication: 'Medication',
  savePrescription: 'Save Prescription',
  salesOverview: 'Sales Overview (2025)',
  totalSales: 'Total Sales',
  averageMonthly: 'Average Monthly',
  exportReport: 'Export Report',
  noNotifications: 'No notifications available.',
  markAsRead: 'Mark as Read',
  clearAll: 'Clear All',
  name: 'Name',
  role: 'Role',
  saveProfile: 'Save Profile',
};

// Define the shape of the context
interface LanguageContextType {
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const t = (key: string) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use the language context
export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 