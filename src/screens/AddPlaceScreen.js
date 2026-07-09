import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const CATEGORIES = ['Beach', 'Library', 'Art Gallery', 'Resort', 'Restaurant', 'Park', 'Museum', 'Other'];

export default function AddPlaceScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddPlace = async () => {
    if (!name || !description || !category) {
      Alert.alert('Error', 'Please fill in all fields and select a category');
      return;
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to add a place');
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await addDoc(collection(db, 'places'), {
        name,
        description,
        category,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        addedBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Place added successfully!');
      setName('');
      setDescription('');
      setCategory('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add a Place</Text>
      <Text style={styles.subtitle}>Share a hidden gem in Greater Accra</Text>

      <Text style={styles.label}>Place Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Labadi Beach"
        placeholderTextColor="#555"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What makes this place special?"
        placeholderTextColor="#555"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, category === cat && styles.catBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddPlace} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Adding Place...' : 'Add Place 📍'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00C896', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 30 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 10, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  catBtnActive: { backgroundColor: '#00C896', borderColor: '#00C896' },
  catText: { color: '#888', fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  button: { backgroundColor: '#00C896', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});