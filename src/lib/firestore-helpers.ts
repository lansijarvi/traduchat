import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  displayName: string;
  avatarUrl?: string;
  language?: 'en' | 'es';
}

// Search users by username
export async function searchUsersByUsername(db: Firestore, searchTerm: string): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '>=', searchTerm.toLowerCase()), where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

// Send friend request
export async function sendFriendRequest(db: Firestore, fromUserId: string, toUserId: string): Promise<void> {
  const friendshipsRef = collection(db, 'friendships');
  await addDoc(friendshipsRef, {
    fromUserId: fromUserId,
    toUserId: toUserId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
}

// Get pending friend requests for a user
export async function getPendingFriendRequests(db: Firestore, userId: string): Promise<any[]> {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(friendshipsRef, where('toUserId', '==', userId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  
  const requests = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const userDoc = await getDoc(doc(db, 'users', data.fromUserId));
    if (userDoc.exists()) {
      requests.push({
        id: docSnap.id,
        ...data,
        fromUser: userDoc.data() as UserProfile,
      });
    }
  }
  return requests;
}

export async function getFriends(db: Firestore, userId: string): Promise<UserProfile[]> {
  const friendshipsRef = collection(db, 'friendships');
  
  const q1 = query(friendshipsRef, where('user1Id', '==', userId), where('status', '==', 'accepted'));
  const q2 = query(friendshipsRef, where('toUserId', '==', userId), where('status', '==', 'accepted'));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const friendIds = new Set<string>();
  snapshot1.docs.forEach(doc => friendIds.add(doc.data().user2Id));
  snapshot2.docs.forEach(doc => friendIds.add(doc.data().user1Id));
  
  const friends: UserProfile[] = [];
  for (const friendId of friendIds) {
    const userDoc = await getDoc(doc(db, 'users', friendId));
    if (userDoc.exists()) {
      friends.push(userDoc.data() as UserProfile);
    }
  }
  
  return friends;
}
