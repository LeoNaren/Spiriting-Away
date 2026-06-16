// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
import { Firestore, getFirestore } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBTxpl-QirclVj-0I6tK_FjgqiR9foeTE8",
  authDomain: "spiriting-away.firebaseapp.com",
  projectId: "spiriting-away",
  storageBucket: "spiriting-away.firebasestorage.app",
  messagingSenderId: "190571218076",
  appId: "1:190571218076:web:4e16d408c08286434f9959",
  measurementId: "G-93PQBKCL2X"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];


export const db = getFirestore(app);
export const auth = getAuth(app);

export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;