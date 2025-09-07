// firebase-config.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBsla-0z8ZyPgfJOTxabFKxBEE2y0oZDD8",
  authDomain: "vafm-admin.firebaseapp.com",
  databaseURL: "https://vafm-admin-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vafm-admin",
  storageBucket: "vafm-admin.firebasestorage.app",
  messagingSenderId: "323614046813",
  appId: "1:323614046813:web:15a1bceb338680abb0ebb4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

firebase.initializeApp(firebaseConfig);
