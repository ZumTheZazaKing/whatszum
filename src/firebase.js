import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "whatszum.firebaseapp.com",
    projectId: "whatszum",
    storageBucket: "whatszum.appspot.com",
    messagingSenderId: "503507477199",
    appId: "1:503507477199:web:cd12dbd7986101acdccdba",
    measurementId: "G-6DFHLR43TP"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth();
export const provider = new GoogleAuthProvider();
export const db = getFirestore();
export const storage = getStorage();