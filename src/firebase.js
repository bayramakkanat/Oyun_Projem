import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Firebase konsolundan aldığınız konfigürasyon bilgilerini buraya yerleştirin.
// https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyAqBSllY17D3U4FrzdC0ANqtz56kUevetU",
  authDomain: "petbattlegame.firebaseapp.com",
  projectId: "petbattlegame",
  storageBucket: "petbattlegame.firebasestorage.app",
  messagingSenderId: "1077775128801",
  appId: "1:1077775128801:web:204f78a856ab70f5607fa0",
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
