import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyA_q5URfSfLWiJFzPkLyIje2t7RONldzlI',
  authDomain: 'notely-8c0cd.firebaseapp.com',
  projectId: 'notely-8c0cd',
  storageBucket: 'notely-8c0cd.firebasestorage.app',
  messagingSenderId: '38516836241',
  appId: '1:38516836241:web:0cb2d34b891840450e7c30',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signUpEmail(email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;
  localStorage.setItem('uid', user.uid);
  return user;
}

export async function signInEmail(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const user = userCred.user;
  localStorage.setItem('uid', user.uid);
  return user;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  localStorage.setItem('uid', user.uid);
  return user;
}

export async function logOut() {
  await signOut(auth);
  localStorage.removeItem('uid');
}

export function getUid() {
  return localStorage.getItem('uid');
}
