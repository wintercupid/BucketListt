import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Platform } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../services/firebase';

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const SEX_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

  const handleStep1 = () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (!fullName || !dob || !sex) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setStep(3);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uid) => {
    if (!profileImage) return null;
    try {
      const response = await fetch(profileImage);
      const blob = await response.blob();
      const imageRef = ref(storage, `profilePictures/${uid}`);
      await uploadBytes(imageRef, blob);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      console.log('Image upload error:', error);
      return null;
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const photoURL = await uploadImage(user.uid);
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        fullName,
        dob,
        sex,
        photoURL: photoURL || null,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        followers: 0,
        following: 0,
      });
    } catch (error) {
      Alert.alert('Signup Error', error.message);
    }
    setLoading(false);
  };

  if (step === 1) return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepText}>Step 1 of 3</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '33%' }]} />
      </View>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Let's get you started</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. explorer_kwame"
        placeholderTextColor="#6B7280"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="your@email.com"
        placeholderTextColor="#6B7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 6 characters"
        placeholderTextColor="#6B7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleStep1}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Log In</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (step === 2) return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepText}>Step 2 of 3</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '66%' }]} />
      </View>
      <Text style={styles.title}>About You</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your full name"
        placeholderTextColor="#6B7280"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        style={styles.input}
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#6B7280"
        value={dob}
        onChangeText={setDob}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Sex</Text>
      <View style={styles.sexOptions}>
        {SEX_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sexBtn, sex === option && styles.sexBtnActive]}
            onPress={() => setSex(option)}
          >
            <Text style={[styles.sexText, sex === option && styles.sexTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonFlex} onPress={handleStep2}>
          <Text style={styles.buttonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (step === 3) return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepText}>Step 3 of 3</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '100%' }]} />
      </View>
      <Text style={styles.title}>Profile Picture</Text>
      <Text style={styles.subtitle}>Add a photo so people know it's you</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>📷</Text>
            <Text style={styles.avatarPlaceholderLabel}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.photoOptions}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnText}>🖼️ Choose from Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
          <Text style={styles.photoBtnText}>📸 Take a Photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account 🚀'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignup} disabled={loading}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setStep(2)}>
        <Text style={styles.link}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  stepText: { color: '#6B7280', fontSize: 13, marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: '#1F2937', borderRadius: 2, marginBottom: 32 },
  progress: { height: 4, backgroundColor: '#3B82F6', borderRadius: 2 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#F9FAFB', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#111827', color: '#F9FAFB', padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#1F2937' },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  buttonFlex: { flex: 1, backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#6B7280', textAlign: 'center', fontSize: 14, marginTop: 16 },
  linkBold: { color: '#3B82F6', fontWeight: 'bold' },
  sexOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  sexBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937' },
  sexBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  sexText: { color: '#6B7280', fontSize: 14 },
  sexTextActive: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: { flex: 1, backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  backButtonText: { color: '#6B7280', fontWeight: 'bold', fontSize: 16 },
  avatarContainer: { alignSelf: 'center', marginVertical: 24 },
  avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#3B82F6' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111827', borderWidth: 2, borderColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 36 },
  avatarPlaceholderLabel: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  photoOptions: { gap: 12, marginBottom: 8 },
  photoBtn: { backgroundColor: '#111827', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  photoBtnText: { color: '#F9FAFB', fontSize: 15 },
  skipText: { color: '#6B7280', textAlign: 'center', marginTop: 16, fontSize: 14 }
});