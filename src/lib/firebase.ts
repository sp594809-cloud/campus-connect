import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// NOTE: Lovable Cloud manages .env automatically, so VITE_FIREBASE_* vars
// can't be injected via .env. Firebase web config values are public client
// identifiers (safe to commit) — security is enforced via Firebase Security
// Rules, not by hiding these keys.
const firebaseConfig = {
  apiKey: "AIzaSyBk22RwGznb1vPoZk0bA3WGqbKtlVxWerc",
  authDomain: "campus-connect-3b190.firebaseapp.com",
  projectId: "campus-connect-3b190",
  storageBucket: "campus-connect-3b190.firebasestorage.app",
  messagingSenderId: "1066098454010",
  appId: "1:1066098454010:web:8351444cd45fba9a8e0843",
  measurementId: "G-YV03X4Q7PX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;