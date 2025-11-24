"use client";

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null, db: null });

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}> = ({ children, app, auth, db }) => {
  return <FirebaseContext.Provider value={{ app, auth, db }}>{children}</FirebaseContext.Provider>;
};

export const useFirebaseApp = () => useContext(FirebaseContext)?.app;
export const useAuth = () => useContext(FirebaseContext)?.auth;
export const useFirestore = () => useContext(FirebaseContext)?.db;
