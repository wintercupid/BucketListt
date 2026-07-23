import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Image, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query, doc, setDoc, deleteDoc, getDoc, getDocs, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../services/firebase';

export default function TimelineScreen() {
  const [posts, setPosts] = useState([]);
  const [placeName, setPlaceName] = useState('');
  const [note, setNote] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'timeline'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);

      const uid = auth.currentUser.uid;
      const likesMap = {};
      const commentsMap = {};

      for (const post of data) {
        const likeRef = doc(db, 'likes', `${uid}_${post.id}`);
        const likeSnap = await getDoc(likeRef);
        likesMap[post.id] = likeSnap.exists();

        const commentsQ = query(collection(db, 'comments'), where('postId', '==', post.id));
        const commentsSnap = await getDocs(commentsQ);
        commentsMap[post.id] = commentsSnap.size;

        if (post.uid && !userProfiles[post.uid]) {
          const userRef = doc(db, 'users', post.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserProfiles(prev => ({ ...prev, [post.uid]: userSnap.data() }));
          }
        }
      }

      setLikes(likesMap);
      setComments(commentsMap);
    });
    return unsubscribe;
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled) setPostImage(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePost = async () => {
    if (!placeName || !note) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      let photoBase64 = null;
      if (postImage) {
        const response = await fetch(postImage);
        const blob = await response.blob();
        photoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      await addDoc(collection(db, 'timeline'), {
        placeName,
        note,
        photoURL: photoBase64 || null,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        likesCount: 0,
      });
      setPlaceName('');
      setNote('');
      setPostImage(null);
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleLike = async (post) => {
    const uid = auth.currentUser.uid;
    const ref = doc(db, 'likes', `${uid}_${post.id}`);
    if (likes[post.id]) {
      await deleteDoc(ref);
      setLikes(prev => ({ ...prev, [post.id]: false }));
    } else {
      await setDoc(ref, { uid, postId: post.id, createdAt: new Date().toISOString() });
      setLikes(prev => ({ ...prev, [post.id]: true }));
    }
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    const q = query(collection(db, 'comments'), where('postId', '==', post.id), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setPostComments(data);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const username = userSnap.exists() ? userSnap.data().username : 'User';

      await addDoc(collection(db, 'comments'), {
        postId: selectedPost.id,
        uid: auth.currentUser.uid,
        username,
        text: commentText,
        createdAt: new Date().toISOString(),
      });
      setPostComments(prev => [...prev, {
        uid: auth.currentUser.uid,
        username,
        text: commentText,
        createdAt: new Date().toISOString(),
      }]);
      setComments(prev => ({ ...prev, [selectedPost.id]: (prev[selectedPost.id] || 0) + 1 }));
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderPost = ({ item }) => {
    const userProfile = userProfiles[item.uid];
    const isLiked = likes[item.id];

    return (
      <View style={styles.post}>
        <View style={styles.postHeader}>
          {userProfile?.photoURL ? (
            <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userProfile?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postUsername}>{userProfile?.username || 'Explorer'}</Text>
            <Text style={styles.postLocation}>📍 {item.placeName}</Text>
          </View>
          <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        {item.photoURL && (
          <Image source={{ uri: item.photoURL }} style={styles.postImage} />
        )}

        <View style={styles.postContent}>
          <Text style={styles.postNote}>{item.note}</Text>

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item)}>
              <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
              <Text style={styles.actionLabel}>Like</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>{comments[item.id] || 0} Comments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🔖</Text>
              <Text style={styles.actionLabel}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Place you visited"
            placeholderTextColor="#6B7280"
            value={placeName}
            onChangeText={setPlaceName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your experience..."
            placeholderTextColor="#6B7280"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>{postImage ? '✅ Photo Added' : '📸 Add Photo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={loading}>
            <Text style={styles.postBtnText}>{loading ? 'Posting...' : 'Share Post'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySub}>Be the first to share!</Text>
          </View>
        }
      />

      <Modal visible={!!selectedPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💬 Comments</Text>
              <TouchableOpacity onPress={() => { setSelectedPost(null); setPostComments([]); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {postComments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              ) : (
                postComments.map((c, i) => (
                  <View key={i} style={styles.comment}>
                    <Text style={styles.commentUsername}>{c.username}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#6B7280"
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleComment}>
                  <Text style={styles.sendBtnText}>Send</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F9FAFB' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  form: { padding: 16, backgroundColor: '#111827', marginHorizontal: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1F2937' },
  input: { backgroundColor: '#0a0f1e', color: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#1F2937', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  photoBtnText: { color: '#F9FAFB', fontSize: 14 },
  postBtn: { backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold' },
  list: { paddingBottom: 20 },
  post: { backgroundColor: '#111827', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, borderWidth: 2, borderColor: '#3B82F6' },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  postHeaderInfo: { flex: 1 },
  postUsername: { color: '#F9FAFB', fontWeight: 'bold', fontSize: 15 },
  postLocation: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  postDate: { color: '#6B7280', fontSize: 11 },
  postImage: { width: '100%', height: 250 },
  postContent: { padding: 14 },
  postNote: { color: '#D1D5DB', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1F2937', paddingTop: 12, gap: 8 },
  actionBtn: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: '#6B7280', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#F9FAFB', fontSize: 18, fontWeight: 'bold' },
  emptySub: { color: '#6B7280', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#F9FAFB', fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#6B7280', fontSize: 20 },
  commentsList: { maxHeight: 300 },
  noComments: { color: '#6B7280', textAlign: 'center', marginTop: 20 },
  comment: { backgroundColor: '#1F2937', padding: 12, borderRadius: 10, marginBottom: 8 },
  commentUsername: { color: '#3B82F6', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  commentText: { color: '#D1D5DB', fontSize: 14 },
  commentInput: { flexDirection: 'row', gap: 10, marginTop: 12 },
  commentTextInput: { flex: 1, backgroundColor: '#1F2937', color: '#F9FAFB', padding: 12, borderRadius: 10, fontSize: 14 },
  sendBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});