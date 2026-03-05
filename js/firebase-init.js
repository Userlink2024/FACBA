// ============================================
// C&A CLOUD FACTORY - Firebase Initialization
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, Timestamp, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase, ref, set, push, onValue, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBVtSkeQe1WZna6nKC4vGxd4ISaRBQ5SVY",
    authDomain: "facba-a160c.firebaseapp.com",
    databaseURL: "https://facba-a160c-default-rtdb.firebaseio.com",
    projectId: "facba-a160c",
    storageBucket: "facba-a160c.firebasestorage.app",
    messagingSenderId: "585530132394",
    appId: "1:585530132394:web:a25cda63f883f786804dd3",
    measurementId: "G-S29LSYM8TQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

// Firestore exports
export { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    onSnapshot,
    Timestamp,
    increment
};

// Realtime Database exports
export { ref, set, push, onValue, onDisconnect, serverTimestamp };

// Auth exports
export { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential };
