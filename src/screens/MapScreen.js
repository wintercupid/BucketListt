import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { PROVIDER_DEFAULT, UrlTile, Marker } from 'react-native-maps';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const CATEGORIES = ['All', 'Beach', 'Library', 'Art Gallery', 'Resort', 'Restaurant', 'Park', 'Museum', 'Other'];

export default function MapScreen() {
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'places'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlaces(data);
    });
    return unsubscribe;
  }, []);

  const filteredPlaces = activeCategory === 'All'
    ? places
    : places.filter(p => p.category === activeCategory);

  const checkSavedVisited = async (place) => {
    const uid = auth.currentUser.uid;
    const savedDoc = await getDoc(doc(db, 'saved', `${uid}_${place.id}`));
    const visitedDoc = await getDoc(doc(db, 'visited', `${uid}_${place.id}`));
    setSaved(savedDoc.exists());
    setVisited(visitedDoc.exists());
  };

  const handleSelectPlace = (place) => {
    setSelected(place);
    checkSavedVisited(place);
  };

  const handleSave = async () => {
    if (!selected) return;
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'saved', `${uid}_${selected.id}`);
    if (saved) {
      await deleteDoc(ref);
      setSaved(false);
    } else {
      await setDoc(ref, {
        uid,
        placeId: selected.id,
        placeName: selected.name,
        category: selected.category || '',
        savedAt: new Date().toISOString(),
      });
      setSaved(true);
    }
  };

  const handleVisited = async () => {
    if (!selected) return;
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'visited', `${uid}_${selected.id}`);
    if (visited) {
      await deleteDoc(ref);
      setVisited(false);
    } else {
      await setDoc(ref, {
        uid,
        placeId: selected.id,
        placeName: selected.name,
        category: selected.category || '',
        visitedAt: new Date().toISOString(),
      });
      setVisited(true);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 5.6037,
          longitude: -0.1870,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor="#3B82F6"
            onPress={() => handleSelectPlace(place)}
          />
        ))}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerText}>TravelVault 🗺️</Text>
        <Text style={styles.headerSub}>{filteredPlaces.length} places in Greater Accra</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterBtn, activeCategory === cat && styles.filterBtnActive]}
              onPress={() => {
                setActiveCategory(cat);
                setSelected(null);
              }}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selected && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {selected.photoURL && (
            <Image
              source={{ uri: selected.photoURL }}
              style={styles.cardImage}
            />
          )}
          <Text style={styles.cardCategory}>{selected.category}</Text>
          <Text style={styles.cardName}>{selected.name}</Text>
          <Text style={styles.cardDesc}>{selected.description}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, saved && styles.actionBtnActive]}
              onPress={handleSave}
            >
              <Text style={styles.actionText}>{saved ? '🔖 Saved' : '🔖 Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, visited && styles.actionBtnActive]}
              onPress={handleVisited}
            >
              <Text style={styles.actionText}>{visited ? '✅ Visited' : '✅ Mark Visited'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(10,15,30,0.85)',
    padding: 12,
    borderRadius: 12,
  },
  headerText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 16 },
  headerSub: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  filterContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(10,15,30,0.85)',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  filterBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  closeText: { color: '#6B7280', fontSize: 18 },
  cardImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 12 },
  cardCategory: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cardName: { color: '#F9FAFB', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { color: '#9CA3AF', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#1F2937', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  actionBtnActive: { borderColor: '#3B82F6', backgroundColor: '#1e3a5f' },
  actionText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});