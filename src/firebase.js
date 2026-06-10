import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Project Indra - Official Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBW8E93TY5JAoXgpWktaffVvRa-z4gY7Sg",
  authDomain: "project-indra-68d89.firebaseapp.com",
  projectId: "project-indra-68d89",
  storageBucket: "project-indra-68d89.firebasestorage.app",
  messagingSenderId: "533508023266",
  appId: "1:533508023266:web:ae4f5c0cc5a21ae5884fbb",
  measurementId: "G-T77PRFNN40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);