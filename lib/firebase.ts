import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDzjpFvhsnmBDMyW2JUp8E8zSsoLJ5P1k",
  authDomain: "anti-slot-69f7a.firebaseapp.com",
  projectId: "anti-slot-69f7a",
  storageBucket: "anti-slot-69f7a.firebasestorage.app",
  messagingSenderId: "78632430413",
  appId: "1:78632430413:web:5efd900932384150b9a504",
  measurementId: "G-B1CX57ZYLR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
