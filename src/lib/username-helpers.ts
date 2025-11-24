import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export async function isUsernameAvailable(db: Firestore, username: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be less than 20 characters' };
  }
  if (!/^[a-z0-9_.]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain lowercase letters, numbers, underscores, and periods' };
  }
  return { valid: true };
}
