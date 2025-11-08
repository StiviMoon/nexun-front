// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCn-wZ9AN9o3L-jTJ4xCwk1g8L5NUXjHB8",
  authDomain: "nexun-ea714.firebaseapp.com",
  projectId: "nexun-ea714",
  storageBucket: "nexun-ea714.firebasestorage.app",
  messagingSenderId: "49949013245",
  appId: "1:49949013245:web:7d00bb80f92d986717ba94",
  measurementId: "G-GL9B6Y7S4Y"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });