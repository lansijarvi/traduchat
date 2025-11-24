"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, type Query, type DocumentData, type CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function useCollection<T extends DocumentData>(ref: CollectionReference<T> | Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
