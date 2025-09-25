import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import Colors from '@/constants/Colors';
import { X, Trash2 } from 'lucide-react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function GlobalNotificationModal() {
  const { notificationsModalVisible, closeNotifications, notifications, markAsRead, clearAll } = useNotification();
  return (
    <Modal visible={notificationsModalVisible} animationType="slide" onRequestClose={closeNotifications}>
      <View style={{ flex: 1, backgroundColor: '#F7F9FC' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1A3C6D' }}>Notifications</Text>
          <TouchableOpacity onPress={closeNotifications}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, padding: 20 }}>
          {notifications.length === 0 ? (
            <Text style={{ color: Colors.gray[800], textAlign: 'center' }}>No notifications available.</Text>
          ) : (
            <>
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={{ padding: 16, backgroundColor: item.isRead ? Colors.gray[100] : Colors.white, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                      <Text style={{ color: Colors.gray[500], fontSize: 12 }}>{item.message}</Text>
                      <Text style={{ color: Colors.gray[500], fontSize: 12 }}>{item.date}</Text>
                    </View>
                    {!item.isRead && (
                      <TouchableOpacity onPress={() => markAsRead(item.id)} style={{ marginLeft: 12 }}>
                        <Text style={{ color: Colors.primary }}>Mark as Read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }} onPress={clearAll}>
                <Trash2 size={20} color={Colors.danger} />
                <Text style={{ color: Colors.danger, marginLeft: 8 }}>Clear All</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      // If not logged in and not in auth group, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // If logged in and in auth group, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      <Stack.Screen name="invoices/invoices" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Handle initial navigation and splash screen
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null to keep splash screen visible while fonts load
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <LanguageProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
            <GlobalNotificationModal />
          </LanguageProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}