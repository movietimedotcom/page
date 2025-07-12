// firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCDwEJP8qE7LSSHnwmRjAprGlpspjr10i4",
  authDomain: "nammagobi-92010.firebaseapp.com",
  databaseURL: "https://nammagobi-92010-default-rtdb.firebaseio.com",
  projectId: "nammagobi-92010",
  storageBucket: "nammagobi-92010.firebasestorage.com", // ✅ Fixed from .firebasestorage.app
  messagingSenderId: "407137810481",
  appId: "1:407137810481:web:f36f95833f4baf08607d10"
};

// ✅ Prevent double initialization (VERY IMPORTANT in Expo Go)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };
