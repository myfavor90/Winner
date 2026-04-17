// Firebase Configuration for JJVTU
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJp5YTJJTKX3ZR-3NQ4vUtTQNcUFzgYEU",
  authDomain: "jjvtu-27340.firebaseapp.com",
  databaseURL: "https://jjvtu-27340-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jjvtu-27340",
  storageBucket: "jjvtu-27340.firebasestorage.app",
  messagingSenderId: "1032568067331",
  appId: "1:1032568067331:web:dabb7880b51d99b8b34536",
  measurementId: "G-4ZL3RB80MY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other files
export { auth, db, analytics };
