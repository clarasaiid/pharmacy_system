import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Search } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { inventory } from '@/services/api';

interface Medicine {
  id: number;
  name: string;
  active_ingredient: string;
  category: string;
  price: number;
  manufacturer: string;
  dosage_form: string;
  effects: string;
  ai_classification: {
    category: string;
    active_ingredient: string;
    effects: string;
  };
}

interface InventoryFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function InventoryForm({ onSubmit, initialData }: InventoryFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    threshold: '',
    manufacturer: '',
    active_ingredient: '',
    supplier: '',
    effects: '',
    ...initialData
  });

  useEffect(() => {
    if (searchQuery) {
      searchMedicines();
    }
  }, [searchQuery]);

  const searchMedicines = async () => {
    try {
      const response = await inventory.searchMedicines(searchQuery);
      setMedicines(response);
    } catch (error) {
      console.error('Error searching medicines:', error);
    }
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      ...formData,
      name: medicine.name,
      category: medicine.category || medicine.ai_classification.category,
      price: medicine.price.toString(),
      manufacturer: medicine.manufacturer,
      active_ingredient: medicine.active_ingredient || medicine.ai_classification.active_ingredient,
      effects: medicine.effects || medicine.ai_classification.effects
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine database..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {medicines.length > 0 && (
          <View style={styles.medicineList}>
            {medicines.map((medicine) => (
              <TouchableOpacity
                key={medicine.id}
                style={styles.medicineItem}
                onPress={() => handleMedicineSelect(medicine)}
              >
                <Text style={styles.medicineName}>{medicine.name}</Text>
                <Text style={styles.medicineDetails}>
                  {medicine.category} • {medicine.active_ingredient}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            value={formData.price}
            keyboardType="numeric"
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Stock"
            value={formData.stock}
            keyboardType="numeric"
            onChangeText={(text) => setFormData({ ...formData, stock: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Threshold"
            value={formData.threshold}
            keyboardType="numeric"
            onChangeText={(text) => setFormData({ ...formData, threshold: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Manufacturer"
            value={formData.manufacturer}
            onChangeText={(text) => setFormData({ ...formData, manufacturer: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Active Ingredient"
            value={formData.active_ingredient}
            onChangeText={(text) => setFormData({ ...formData, active_ingredient: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Supplier"
            value={formData.supplier}
            onChangeText={(text) => setFormData({ ...formData, supplier: text })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Effects"
            value={formData.effects}
            multiline
            numberOfLines={4}
            onChangeText={(text) => setFormData({ ...formData, effects: text })}
          />
        </View>

        <Button onPress={handleSubmit} title="Save" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  medicineList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  medicineItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  medicineDetails: {
    fontSize: 14,
    color: Colors.gray,
  },
  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 