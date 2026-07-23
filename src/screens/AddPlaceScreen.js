import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useState } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const CATEGORIES = ['Beach', 'Library', 'Art Gallery', 'Resort', 'Restaurant', 'Park', 'Museum', 'Other'];

export default function AddPlaceScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [placeImage, setPlaceImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
      });
      if (!result.canceled) {
        setPlaceImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.5,
      });
      if (!result.canceled) {
        setPlaceImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

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

      let photoBase64 = null;
      if (placeImage) {
        const response = await fetch(placeImage);
        const blob = await response.blob();
        photoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      await addDoc(collection(db, 'places'), {
        name,
        description,
        category,
        photoURL: photoBase64 || null,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        addedBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Place added successfully!');
      setName('');
      setDescription('');
      setCategory('');
      setPlaceImage(null);
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
        placeholderTextColor="#6B7280"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What makes this place special?"
        placeholderTextColor="#6B7280"
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

      <Text style={styles.label}>Photo</Text>
      {placeImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: placeImage }} style={styles.placeImage} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => setPlaceImage(null)}>
            <Text style={styles.removeBtnText}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoOptions}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>🖼️ Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>📸 Take a Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleAddPlace} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Adding Place...' : 'Add Place 📍'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F9FAFB', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 30 },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#111827', color: '#F9FAFB', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#1F2937' },
  textArea: { height: 100, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937' },
  catBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  catText: { color: '#6B7280', fontSize: 13 },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  photoOptions: { gap: 10 },
  photoBtn: { backgroundColor: '#111827', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  photoBtnText: { color: '#F9FAFB', fontSize: 15 },
  imageContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  placeImage: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: { backgroundColor: '#1F2937', padding: 10, alignItems: 'center', marginTop: 8, borderRadius: 8 },
  removeBtnText: { color: '#EF4444', fontWeight: 'bold' },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});