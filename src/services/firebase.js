import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDvjlx78S4FpGj96_PeDv2amqqRawtCJ-8",
  authDomain: "bucketlist-4957c.firebaseapp.com",
  projectId: "bucketlist-4957c",
  storageBucket: "bucketlist-4957c.firebasestorage.app",
  messagingSenderId: "570594995454",
  appId: "1:570594995454:web:860650e406c21ba8cb49af"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);