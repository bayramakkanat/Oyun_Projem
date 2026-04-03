import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAqBSllY17D3U4FrzdC0ANqtz56kUevetU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "petbattlegame.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "petbattlegame",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "petbattlegame.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1077775128801",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1077775128801:web:204f78a856ab70f5607fa0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
