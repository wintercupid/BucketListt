import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState({});

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchText),
        where('username', '<=', searchText + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.uid !== auth.currentUser.uid);

      const followMap = {};
      for (const user of users) {
        const ref = doc(db, 'follows', `${auth.currentUser.uid}_${user.uid}`);
        const snap = await getDoc(ref);
        followMap[user.uid] = snap.exists();
      }
      setFollowing(followMap);
      setResults(users);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleFollow = async (user) => {
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'follows', `${uid}_${user.uid}`);
    if (following[user.uid]) {
      await deleteDoc(ref);
      setFollowing(prev => ({ ...prev, [user.uid]: false }));
    } else {
      await setDoc(ref, {
        followerId: uid,
        followingId: user.uid,
        createdAt: new Date().toISOString(),
      });
      setFollowing(prev => ({ ...prev, [user.uid]: true }));
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.username?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followBtn, following[item.uid] && styles.followingBtn]}
        onPress={() => handleFollow(item)}
      >
        <Text style={[styles.followBtnText, following[item.uid] && styles.followingBtnText]}>
          {following[item.uid] ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Explorers</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by username..."
          placeholderTextColor="#6B7280"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#3B82F6" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Search for explorers</Text>
              <Text style={styles.emptySub}>Find people to follow</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e', paddingTop: 60, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F9FAFB', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#111827', color: '#F9FAFB', padding: 12, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: '#1F2937' },
  searchBtn: { backgroundColor: '#3B82F6', padding: 12, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  list: { paddingBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1F2937' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  userInfo: { flex: 1 },
  username: { color: '#F9FAFB', fontWeight: 'bold', fontSize: 15 },
  email: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  followBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3B82F6' },
  followBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  followingBtnText: { color: '#3B82F6' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#F9FAFB', fontSize: 18, fontWeight: 'bold' },
  emptySub: { color: '#6B7280', marginTop: 8 }
});