import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <TouchableOpacity style={styles.button} onPress={() => signOut(auth)}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#00C896', fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  button: { backgroundColor: '#00C896', padding: 14, borderRadius: 10, width: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});