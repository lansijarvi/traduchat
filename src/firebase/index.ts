import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { FirebaseClientProvider, useFirebaseClient } from './client-provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';

// Re-export the client provider
export { FirebaseClientProvider };

// Create hooks that use the client context
export function useAuth(): Auth | null {
  const firebase = useFirebaseClient();
  return firebase?.auth || null;
}

export function useFirestore(): Firestore | null {
  const firebase = useFirebaseClient();
  return firebase?.db || null;
}

export function useStorage(): FirebaseStorage | null {
  const firebase = useFirebaseClient();
  return firebase?.storage || null;
}

export function useFirebaseApp(): FirebaseApp | null {
  const firebase = useFirebaseClient();
  return firebase?.app || null;
}

export {
  useCollection,
  useDoc,
  useUser,
};
