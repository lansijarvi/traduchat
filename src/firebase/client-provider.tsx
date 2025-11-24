'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

const FirebaseContext = createContext<any>(null);

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const auth = getAuth(app);
      const db = getFirestore(app);
      const storage = getStorage(app);
      
      setFirebaseApp({ app, auth, db, storage });
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <FirebaseContext.Provider value={firebaseApp}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseClient() {
  return useContext(FirebaseContext);
}
