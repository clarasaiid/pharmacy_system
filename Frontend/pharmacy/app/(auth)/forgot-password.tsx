import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setCodeSent(true);
    Alert.alert('Reset Code Sent', 'A reset code has been sent to your email (demo).');
  };

  const handleReset = () => {
    if (!email || !verificationCode || !newPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Password reset (demo)!');
      router.push('/login');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.verificationRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
        />
        <Button
          title={codeSent ? 'Resend' : 'Send Code'}
          onPress={handleSendCode}
          variant="outline"
          style={styles.sendCodeButton}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Button title={loading ? 'Resetting...' : 'Reset Password'} onPress={handleReset} disabled={loading} style={styles.resetButton} />
      <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkContainer}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    fontSize: 16,
    color: Colors.gray[800],
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    marginBottom: 16,
  },
  sendCodeButton: {
    marginLeft: 8,
    minWidth: 100,
  },
  resetButton: {
    width: '100%',
    maxWidth: 340,
    marginTop: 8,
    marginBottom: 16,
  },
  linkContainer: {
    marginTop: 8,
  },
  link: {
    color: Colors.primary,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    textAlign: 'center',
  },
}); 