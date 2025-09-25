import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const GENDERS = ['Male', 'Female', 'Other'];

const getMinBirthdate = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 15);
  return today;
};

const isValidBirthdate = (date: Date | null) => {
  if (!date) return false;
  const now = new Date();
  const min = getMinBirthdate();
  return date <= min && date <= now;
};

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [birthdate, setBirthdate] = useState<Date | string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const validateFields = () => {
    const errors: any = {};
    if (!firstName) errors.firstName = 'First name is required.';
    if (firstName && firstName.length < 2) errors.firstName = 'First name is too short.';
    if (!secondName) errors.secondName = 'Second name is required.';
    if (secondName && secondName.length < 2) errors.secondName = 'Second name is too short.';
    if (!email) errors.email = 'Email is required.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = 'Email is invalid.';
    if (!phoneNumber) errors.phoneNumber = 'Phone number is required.';
    else if (phoneNumber.length < 7) errors.phoneNumber = 'Phone number is too short.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8) errors.password = 'Password is too short.';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!gender) errors.gender = 'Gender is required.';
    if (!address) errors.address = 'Address is required.';
    if (!birthdate) errors.birthdate = 'Birthdate is required.';
    else if (!isValidBirthdate(birthdate instanceof Date ? birthdate : new Date(birthdate))) errors.birthdate = 'Pick a valid birthdate (at least 15 years ago, not in the future).';
    return errors;
  };

  const handleRegister = async () => {
    setFieldErrors({});
    setSuccess('');
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      let birthdateStr = '';
      if (Platform.OS === 'web') {
        birthdateStr = typeof birthdate === 'string' ? birthdate : '';
      } else {
        birthdateStr = birthdate instanceof Date ? birthdate.toISOString().split('T')[0] : '';
      }

      const userData = {
        first_name: firstName,
        second_name: secondName,
        email,
        username: email,
        password,
        phone_number: phoneNumber,
        gender,
        address,
        birthdate: birthdateStr,
      };

      // Register the user (this will only check email and send verification code)
      const response = await auth.register(userData);
      
      // If registration is successful (no email exists), show success message
      setSuccess(response.message);
      
      // Navigate to verification page with user data
      router.push({
        pathname: '/verify',
        params: { userData: JSON.stringify(userData) }
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setFieldErrors({ general: detail });
      } else if (Array.isArray(detail)) {
        // Try to map FastAPI validation errors to fields
        const apiErrors: any = {};
        detail.forEach((d: any) => {
          if (d.loc && d.loc.length > 0) {
            const field = d.loc[d.loc.length - 1];
            apiErrors[field] = d.msg;
          }
        });
        setFieldErrors(apiErrors);
      } else if (typeof detail === 'object' && detail !== null) {
        setFieldErrors({ general: JSON.stringify(detail) });
      } else {
        setFieldErrors({ general: 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // For web, use a native date input
  const renderBirthdateInput = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.inputColumn}>
          <Text style={styles.label}>Birthdate</Text>
          <input
            style={{
              width: '100%',
              height: 44,
              borderRadius: 8,
              padding: '0 16px',
              fontSize: 16,
              border: '1px solid #e0e0e0',
              background: '#fff',
              boxSizing: 'border-box',
              marginBottom: 0,
            }}
            type="date"
            value={birthdate ? (typeof birthdate === 'string' ? birthdate : (birthdate as Date).toISOString().split('T')[0]) : ''}
            max={getMinBirthdate().toISOString().split('T')[0]}
            onChange={e => {
              setBirthdate(e.target.value);
            }}
          />
          {fieldErrors.birthdate && <Text style={styles.error}>{fieldErrors.birthdate}</Text>}
        </View>
      );
    }
    // For mobile, use DateTimePicker
    return (
      <View style={styles.inputColumn}>
        <Text style={styles.label}>Birthdate</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: birthdate ? '#222' : '#aaa', fontSize: 16 }}>
            {birthdate ? (birthdate instanceof Date ? birthdate.toLocaleDateString() : birthdate) : 'Birthdate'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthdate instanceof Date ? birthdate : new Date(2000, 0, 1)}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setBirthdate(date);
            }}
            maximumDate={getMinBirthdate()}
          />
        )}
        {fieldErrors.birthdate && <Text style={styles.error}>{fieldErrors.birthdate}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        {fieldErrors.general && <Text style={styles.error}>{fieldErrors.general}</Text>}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <View style={styles.row}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
            />
            {fieldErrors.firstName && <Text style={styles.error}>{fieldErrors.firstName}</Text>}
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Second Name</Text>
            <TextInput
              style={styles.input}
              value={secondName}
              onChangeText={setSecondName}
              placeholder="Second Name"
            />
            {fieldErrors.secondName && <Text style={styles.error}>{fieldErrors.secondName}</Text>}
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {fieldErrors.email && <Text style={styles.error}>{fieldErrors.email}</Text>}
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
            {fieldErrors.phoneNumber && <Text style={styles.error}>{fieldErrors.phoneNumber}</Text>}
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
            {fieldErrors.password && <Text style={styles.error}>{fieldErrors.password}</Text>}
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              secureTextEntry
            />
            {fieldErrors.confirmPassword && <Text style={styles.error}>{fieldErrors.confirmPassword}</Text>}
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
            />
            {fieldErrors.address && <Text style={styles.error}>{fieldErrors.address}</Text>}
          </View>
          {renderBirthdateInput()}
        </View>
        <View style={styles.row}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                  onPress={() => setGender(g)}
                >
                  <Text style={{ color: gender === g ? '#fff' : '#4db6ac' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {fieldErrors.gender && <Text style={styles.error}>{fieldErrors.gender}</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9eef2',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4db6ac',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  inputColumn: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 8,
    minWidth: 150,
    maxWidth: 320,
  },
  label: {
    fontSize: 15,
    color: '#4db6ac',
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  genderButton: {
    borderWidth: 1,
    borderColor: '#4db6ac',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  genderButtonSelected: {
    backgroundColor: '#4db6ac',
  },
  registerButton: {
    width: 320,
    height: 48,
    backgroundColor: '#4db6ac',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    color: '#4db6ac',
    fontSize: 16,
    marginTop: 8,
    alignSelf: 'center',
  },
  error: {
    color: 'red',
    marginTop: 2,
    marginBottom: 2,
    fontSize: 13,
    textAlign: 'left',
    marginLeft: 2,
  },
  success: {
    color: 'green',
    marginBottom: 12,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default RegisterScreen; 