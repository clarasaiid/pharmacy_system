import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

interface NotificationContextProps {
  notifications: Notification[];
  notificationsModalVisible: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const initialNotifications: Notification[] = [
  { id: '1', title: 'Low Stock Alert', message: 'Paracetamol 500mg is running low (20 units left).', date: '2025-05-19 01:30 AM', isRead: false },
  { id: '2', title: 'Supplier Update', message: 'MediSupply Co. has delivered 500 units of Ibuprofen.', date: '2025-05-18 10:00 AM', isRead: false },
  { id: '3', title: 'Prescription Reminder', message: "Alice Johnson's Amoxicillin refill is due today.", date: '2025-05-17 09:00 AM', isRead: true },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const openNotifications = () => setNotificationsModalVisible(true);
  const closeNotifications = () => setNotificationsModalVisible(false);
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, notificationsModalVisible, openNotifications, closeNotifications, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
} 