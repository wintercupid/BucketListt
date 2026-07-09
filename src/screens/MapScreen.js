import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { PROVIDER_DEFAULT, UrlTile, Marker } from 'react-native-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function MapScreen() {
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'places'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlaces(data);
    });
    return unsubscribe;
  }, []);

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
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor="#00C896"
            onPress={() => setSelected(place)}
          />
        ))}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerText}>TravelVault 🗺️</Text>
        <Text style={styles.headerSub}>{places.length} places in Greater Accra</Text>
      </View>

      {selected && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.cardCategory}>{selected.category}</Text>
          <Text style={styles.cardName}>{selected.name}</Text>
          <Text style={styles.cardDesc}>{selected.description}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 12,
    borderRadius: 12,
  },
  headerText: { color: '#00C896', fontWeight: 'bold', fontSize: 16 },
  headerSub: { color: '#888', fontSize: 12, marginTop: 2 },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  closeBtn: { position: 'absolute', top: 12, right: 12 },
  closeText: { color: '#888', fontSize: 18 },
  cardCategory: { color: '#00C896', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  cardName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { color: '#aaa', fontSize: 14, lineHeight: 20 },
});