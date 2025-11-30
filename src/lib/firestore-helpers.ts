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
  setDoc,
  deleteDoc,
  or,
  and
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
  const lowerSearch = searchTerm.toLowerCase();
  
  // Get all users and filter in memory (Firestore doesn't support OR queries easily)
  const snapshot = await getDocs(usersRef);
  
  const results = snapshot.docs
    .map(doc => doc.data() as UserProfile)
    .filter(user => {
      // Search by username (partial match)
      if (user.username?.toLowerCase().includes(lowerSearch)) return true;
      
      // Search by email (exact or partial match)
      if (user.email?.toLowerCase().includes(lowerSearch)) return true;
      
      // Search by display name (partial match)
      if (user.displayName?.toLowerCase().includes(lowerSearch)) return true;
      
      return false;
    });
  
  return results;
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
  
  const q1 = query(friendshipsRef, where('fromUserId', '==', userId), where('status', '==', 'accepted'));
  const q2 = query(friendshipsRef, where('toUserId', '==', userId), where('status', '==', 'accepted'));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const friendIds = new Set<string>();
  snapshot1.docs.forEach(doc => friendIds.add(doc.data().toUserId));
  snapshot2.docs.forEach(doc => friendIds.add(doc.data().fromUserId));
  
  const friends: UserProfile[] = [];
  if (friendIds.size > 0) {
    const usersRef = collection(db, 'users');
    const friendsQuery = query(usersRef, where('uid', 'in', Array.from(friendIds)));
    const friendsSnapshot = await getDocs(friendsQuery);
    friendsSnapshot.forEach(doc => {
      friends.push(doc.data() as UserProfile);
    });
  }
  
  return friends;
}

export async function deleteFriend(db: Firestore, userId: string, friendId: string): Promise<void> {
  const friendshipsRef = collection(db, 'friendships');
  const snapshot = await getDocs(friendshipsRef);
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (((data.fromUserId === userId && data.toUserId === friendId) || (data.fromUserId === friendId && data.toUserId === userId)) && data.status === 'accepted') {
      await deleteDoc(docSnap.ref);
      break;
    }
  }
}