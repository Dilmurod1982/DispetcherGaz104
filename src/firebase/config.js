import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0uixQuCY2skspABvyr6Eh9xRAmoY15zo",
  authDomain: "dispatch-73972.firebaseapp.com",
  projectId: "dispatch-73972",
  storageBucket: "dispatch-73972.firebasestorage.app",
  messagingSenderId: "728277589784",
  appId: "1:728277589784:web:101e33dc4dc46b69ad486d",
  measurementId: "G-DC3VWL9W7H",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
