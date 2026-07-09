import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfile(docSnap.data());
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchProfile();

    const uid = auth.currentUser.uid;

    const savedQ = query(collection(db, 'saved'), where('uid', '==', uid));
    const unsubSaved = onSnapshot(savedQ, (snap) => {
      setSavedPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const visitedQ = query(collection(db, 'visited'), where('uid', '==', uid));
    const unsubVisited = onSnapshot(visitedQ, (snap) => {
      setVisitedPlaces(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSaved(); unsubVisited(); };
  }, []);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator color="#00C896" size="large" />
    </View>
  );

  const renderPlace = ({ item }) => (
    <View style={styles.placeCard}>
      <Text style={styles.placeCat}>{item.category}</Text>
      <Text style={styles.placeName}>{item.placeName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{profile?.username || 'Explorer'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{savedPlaces.length}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{visitedPlaces.length}</Text>
          <Text style={styles.statLabel}>Visited</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>🔖 Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'visited' && styles.tabActive]}
          onPress={() => setActiveTab('visited')}
        >
          <Text style={[styles.tabText, activeTab === 'visited' && styles.tabTextActive]}>✅ Visited</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'saved' ? savedPlaces : visitedPlaces}
        keyExtractor={item => item.id}
        renderItem={renderPlace}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === 'saved' ? 'No saved places yet' : 'No visited places yet'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  centered: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00C896', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  username: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: '#555' },
  stats: { flexDirection: 'row', backgroundColor: '#111', marginHorizontal: 24, borderRadius: 16, padding: 16, justifyContent: 'space-around', borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#00C896' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#222' },
  tabs: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 12 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#222' },
  tabActive: { borderBottomColor: '#00C896' },
  tabText: { color: '#555', fontWeight: 'bold' },
  tabTextActive: { color: '#00C896' },
  list: { paddingHorizontal: 24 },
  placeCard: { backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  placeCat: { color: '#00C896', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  placeName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 30 },
  logoutBtn: { margin: 24, backgroundColor: '#1a1a1a', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  logoutText: { color: '#ff4444', fontWeight: 'bold', fontSize: 16 }
});