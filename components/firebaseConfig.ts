import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PASTE YOUR CONFIG HERE (the one you copied from Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyCh_Habh0ckQ72-eHLiRt1tJogNLDyesuI",
  authDomain: "sudokle-9eaec.firebaseapp.com",
  projectId: "sudokle-9eaec",
  storageBucket: "sudokle-9eaec.firebasestorage.app",
  messagingSenderId: "596801374606",
  appId: "1:596801374606:web:0a8358faf334061e44bcdf",
  measurementId: "G-D11H5S7WB2"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);