import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import firebaseConfig from './firebaseConfig';

let app;
let auth;

function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}

export function getAuthInstance() {
  return initFirebase();
}

export async function signInWithGoogle() {
  const auth = initFirebase();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout() {
  const auth = initFirebase();
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback) {
  const auth = initFirebase();
  return firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        token,
      });
    } else {
      callback(null);
    }
  });
}

export async function getIdToken() {
  const auth = initFirebase();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
