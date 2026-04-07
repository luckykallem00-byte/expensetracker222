import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const configUrl = '/api/config';
let authInstance;

async function fetchFirebaseConfig() {
  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error('Unable to load Firebase configuration');
  }
  return response.json();
}

export async function initFirebase() {
  if (authInstance) return authInstance;

  const firebaseConfig = await fetchFirebaseConfig();
  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  return authInstance;
}

export async function signInWithGoogle() {
  const auth = await initFirebase();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();

  const user = {
    uid: result.user.uid,
    name: result.user.displayName || '',
    email: result.user.email || '',
    photoURL: result.user.photoURL || '',
  };

  localStorage.setItem('authUser', JSON.stringify(user));
  localStorage.setItem('authToken', token);
  window.location.href = 'index.html';
}

export function getAuthUser() {
  return JSON.parse(localStorage.getItem('authUser') || 'null');
}

export async function getAuthToken() {
  const auth = await initFirebase();
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    localStorage.setItem('authToken', token);
    return token;
  }
  return localStorage.getItem('authToken');
}

export async function logout() {
  try {
    const auth = await initFirebase();
    await signOut(auth);
  } catch (_) {
    // ignore sign-out errors and clear local state anyway
  }

  localStorage.removeItem('authUser');
  localStorage.removeItem('authToken');
  window.location.href = 'login.html';
}
