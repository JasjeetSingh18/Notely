// src/firebase.mjs
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_q5URfSfLWiJFzPkLyIje2t7RONldzlI",
  authDomain: "notely-8c0cd.firebaseapp.com",
  projectId: "notely-8c0cd",
  storageBucket: "notely-8c0cd.firebasestorage.app",
  messagingSenderId: "38516836241",
  appId: "1:38516836241:web:0cb2d34b891840450e7c30",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ---------- AUTH HELPERS ----------
export async function signUpEmail(email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  localStorage.setItem("uid", uid); // save for later
  return uid;
}

export async function signInEmail(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  localStorage.setItem("uid", uid);
  return uid;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  localStorage.setItem("uid", result.user.uid);
  return result.user; // return full user object
}
export async function logOut() {
  await signOut(auth);
  localStorage.removeItem("uid");
}

export function getUid() {
  return localStorage.getItem("uid");
}