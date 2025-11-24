import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  language: 'en' | 'es';
  createdAt: Timestamp;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted';
  requestedBy: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}

// Search for users by username
export async function searchUsers(db: Firestore, searchQuery: string): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchQuery.toLowerCase()),
    where('username', '<=', searchQuery.toLowerCase() + '\uf8ff')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
}

// Send friend request
export async function sendFriendRequest(db: Firestore, fromUserId: string, toUserId: string): Promise<string> {
  // Check if friendship already exists
  const existing = await getFriendship(db, fromUserId, toUserId);
  if (existing) {
    throw new Error('Friend request already exists');
  }

  const friendshipsRef = collection(db, 'friendships');
  const docRef = await addDoc(friendshipsRef, {
    user1Id: fromUserId,
    user2Id: toUserId,
    status: 'pending',
    requestedBy: fromUserId,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}

// Get friendship between two users
export async function getFriendship(db: Firestore, user1Id: string, user2Id: string): Promise<Friendship | null> {
  const friendshipsRef = collection(db, 'friendships');
  
  // Check both directions
  const q1 = query(friendshipsRef, where('user1Id', '==', user1Id), where('user2Id', '==', user2Id));
  const q2 = query(friendshipsRef, where('user1Id', '==', user2Id), where('user2Id', '==', user1Id));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const doc = snapshot1.docs[0] || snapshot2.docs[0];
  if (!doc) return null;
  
  return { id: doc.id, ...doc.data() } as Friendship;
}

// Accept friend request
export async function acceptFriendRequest(db: Firestore, friendshipId: string): Promise<void> {
  const friendshipRef = doc(db, 'friendships', friendshipId);
  await updateDoc(friendshipRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
}

// Get all friends for a user
export async function getFriends(db: Firestore, userId: string): Promise<UserProfile[]> {
  const friendshipsRef = collection(db, 'friendships');
  
  const q1 = query(friendshipsRef, where('user1Id', '==', userId), where('status', '==', 'accepted'));
  const q2 = query(friendshipsRef, where('user2Id', '==', userId), where('status', '==', 'accepted'));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const friendIds = new Set<string>();
  snapshot1.docs.forEach(doc => friendIds.add(doc.data().user2Id));
  snapshot2.docs.forEach(doc => friendIds.add(doc.data().user1Id));
  
  // Fetch all friend profiles
  const friendProfiles = await Promise.all(
    Array.from(friendIds).map(async (friendId) => {
      const userDoc = await getDoc(doc(db, 'users', friendId));
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    })
  );
  
  return friendProfiles;
}

// Get pending friend requests (received)
export async function getPendingRequests(db: Firestore, userId: string): Promise<Friendship[]> {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(
    friendshipsRef,
    where('user2Id', '==', userId),
    where('status', '==', 'pending')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friendship));
}
