import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Card from '@/components/ui/Card';
import { medicineDatabase } from '@/services/api';

interface Props {
  onSuccess?: () => void;
}

export default function MedicineDatabaseUpload({ onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      // Pick the CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv'
      } as any);

      // Upload the file
      await medicineDatabase.upload(formData);
      setSuccess(true);
      onSuccess?.(); // Call the success callback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <View style={styles.container}>
        <Text style={styles.title}>Medicine Database</Text>
        <Text style={styles.description}>
          Upload your medicine database CSV file to enable automatic medicine lookup and classification.
        </Text>
        
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Upload size={20} color={Colors.white} style={styles.uploadIcon} />
              <Text style={styles.uploadText}>Upload CSV File</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {success && (
          <Text style={styles.success}>Database uploaded successfully!</Text>
        )}

        <Text style={styles.helpText}>
          The CSV file should include these columns:
          name, price
          
          Example:
          name,price
          Paracetamol 500mg,5.99
          Amoxicillin 250mg,12.49
          
          Other details will be automatically detected using AI.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: Colors.danger,
    marginBottom: 10,
  },
  success: {
    color: Colors.success,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
  },
}); 