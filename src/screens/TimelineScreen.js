import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export default function TimelineScreen() {
  const [posts, setPosts] = useState([]);
  const [placeName, setPlaceName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'timeline'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });
    return unsubscribe;
  }, []);

  const handlePost = async () => {
    if (!placeName || !note) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'timeline'), {
        placeName,
        note,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      });
      setPlaceName('');
      setNote('');
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>📍</Text>
        </View>
        <View>
          <Text style={styles.postPlace}>{item.placeName}</Text>
          <Text style={styles.postDate}>{new Date(item.createdAt).toDateString()}</Text>
        </View>
      </View>
      <Text style={styles.postNote}>{item.note}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Post'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Place you visited"
            placeholderTextColor="#555"
            value={placeName}
            onChangeText={setPlaceName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your experience..."
            placeholderTextColor="#555"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={loading}>
            <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Share Experience'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySub}>Be the first to share a place!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#00C896' },
  addBtn: { backgroundColor: '#00C896', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  form: { padding: 16, backgroundColor: '#111', marginHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  postBtn: { backgroundColor: '#00C896', padding: 14, borderRadius: 10, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  post: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18 },
  postPlace: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  postDate: { color: '#555', fontSize: 12, marginTop: 2 },
  postNote: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptySub: { color: '#555', marginTop: 8 }
});