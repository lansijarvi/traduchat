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
  or
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
  
  // Find the friendship document
  const q = query(
    friendshipsRef,
    or(
      where('fromUserId', '==', userId),
      where('toUserId', '==', userId)
    ),
    or(
      where('fromUserId', '==', friendId),
      where('toUserId', '==', friendId)
    ),
    where('status', '==', 'accepted')
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Should only be one, but we'll loop just in case
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, 'friendships', docSnap.id));
    }
  } else {
    // This case might be more complex if the friendship doc is not found as expected.
    // Fallback queries if the compound `or` is not supported or misbehaving.
    const q1 = query(friendshipsRef, where('fromUserId', '==', userId), where('toUserId', '==', friendId), where('status', '==', 'accepted'));
    const q2 = query(friendshipsRef, where('toUserId', '==', userId), where('fromUserId', '==', friendId), where('status', '==', 'accepted'));
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    for (const docSnap of snapshot1.docs) {
      await deleteDoc(doc(db, 'friendships', docSnap.id));
    }
    for (const docSnap of snapshot2.docs) {
      await deleteDoc(doc(db, 'friendships', docSnap.id));
    }
  }

  // Also delete the conversation
  const conversationId = [userId, friendId].sort().join('_');
  const conversationRef = doc(db, 'conversations', conversationId);
  await deleteDoc(conversationRef);
}