import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Pill } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Button from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View entering={FadeInDown.duration(800)} style={styles.formContainer}>
        <LinearGradient
          colors={[Colors.white, Colors.gray[50]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.logoContainer}>
            <Pill size={40} color={Colors.primary} />
            <Text style={styles.title}>Pharmacy Login</Text>
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color={Colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.gray[500]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Colors.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.gray[500]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              accessibilityLabel="Password input"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOff size={20} color={Colors.gray[500]} /> : <Eye size={20} color={Colors.gray[500]} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.linkContainer}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginButton}
            accessibilityLabel="Login button"
            icon={loading ? <ActivityIndicator size="small" color={Colors.white} /> : null}
          />

          <Button
            title="Register"
            onPress={() => router.push('/(auth)/register')}
            variant="secondary"
            style={styles.registerButton}
          />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 24,
  },
  formContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    marginBottom: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[800],
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 8,
  },
  linkContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  link: {
    color: Colors.primary,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButton: {
    marginTop: 10,
  },
});