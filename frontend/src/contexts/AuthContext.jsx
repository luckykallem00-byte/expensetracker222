import { createContext, useContext, useEffect, useState } from 'react';
import { signInWithGoogle, logout as firebaseLogout, onAuthStateChanged } from '../firebase/firebaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signIn() {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (signInError) {
      setError(signInError?.message || 'Unable to sign in');
      throw signInError;
    }
  }

  async function logout() {
    try {
      setError(null);
      await firebaseLogout();
      setUser(null);
    } catch (logoutError) {
      setError(logoutError?.message || 'Unable to sign out');
      throw logoutError;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
