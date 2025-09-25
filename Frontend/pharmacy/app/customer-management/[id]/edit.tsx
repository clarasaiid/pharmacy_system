import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Header from '@/components/ui/Header';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
}

interface InsuranceErrors {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
}

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: 'Ahmed Mohamed',
    phone: '+1 234 567 8900',
    email: 'ahmed.mohamed@email.com',
    address: '123 Main St, City, State 12345',
    insurance: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS123456789',
      groupNumber: 'GRP987654',
    },
  });
  const [errors, setErrors] = useState<Partial<Omit<CustomerFormData, 'insurance'>> & { insurance?: InsuranceErrors }>({});

  const validateForm = () => {
    const newErrors: Partial<Omit<CustomerFormData, 'insurance'>> & { insurance?: InsuranceErrors } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.insurance.provider.trim()) {
      newErrors.insurance = { ...newErrors.insurance, provider: 'Insurance provider is required' };
    }
    if (!formData.insurance.policyNumber.trim()) {
      newErrors.insurance = { ...newErrors.insurance, policyNumber: 'Policy number is required' };
    }
    if (!formData.insurance.groupNumber.trim()) {
      newErrors.insurance = { ...newErrors.insurance, groupNumber: 'Group number is required' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Here you would typically make an API call to update the customer
      console.log('Customer updated:', formData);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Edit Customer"
        rightComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter customer's full name"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Insurance Provider</Text>
              <TextInput
                style={styles.input}
                value={formData.insurance.provider}
                onChangeText={(text) => setFormData({
                  ...formData,
                  insurance: { ...formData.insurance, provider: text }
                })}
                placeholder="Enter insurance provider"
              />
              {errors.insurance?.provider && (
                <Text style={styles.errorText}>{errors.insurance.provider}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Policy Number</Text>
              <TextInput
                style={styles.input}
                value={formData.insurance.policyNumber}
                onChangeText={(text) => setFormData({
                  ...formData,
                  insurance: { ...formData.insurance, policyNumber: text }
                })}
                placeholder="Enter policy number"
              />
              {errors.insurance?.policyNumber && (
                <Text style={styles.errorText}>{errors.insurance.policyNumber}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Number</Text>
              <TextInput
                style={styles.input}
                value={formData.insurance.groupNumber}
                onChangeText={(text) => setFormData({
                  ...formData,
                  insurance: { ...formData.insurance, groupNumber: text }
                })}
                placeholder="Enter group number"
              />
              {errors.insurance?.groupNumber && (
                <Text style={styles.errorText}>{errors.insurance.groupNumber}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[800],
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.gray[700],
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
}); 