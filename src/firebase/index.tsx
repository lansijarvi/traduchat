"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
  user: null,
  loading: true,
});

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const firebaseAuth = getAuth(firebaseApp);
      const firebaseDb = getFirestore(firebaseApp);

      setApp(firebaseApp);
      setAuth(firebaseAuth);
      setDb(firebaseDb);

      const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setLoading(false);
    }
  }, []);

  // Show loading state during SSR to match client
  if (!mounted) {
    return (
      <FirebaseContext.Provider value={{ app: null, auth: null, db: null, user: null, loading: true }}>
        {children}
      </FirebaseContext.Provider>
    );
  }

  return (
    <FirebaseContext.Provider value={{ app, auth, db, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseClientProvider');
  }
  return context;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useFirestore() {
  return useFirebase().db;
}

export function useUser() {
  const { user, loading } = useFirebase();
  return { user, loading };
}
