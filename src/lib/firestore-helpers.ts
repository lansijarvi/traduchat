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
    user1Id: fromUserId,
    user2Id: toUserId,
    status: 'pending',
    requestedBy: fromUserId,
    createdAt: serverTimestamp(),
  });
}

// Get pending friend requests for a user
export async function getPendingFriendRequests(db: Firestore, userId: string): Promise<any[]> {
  const friendshipsRef = collection(db, 'friendships');
  const q = query(friendshipsRef, where('user2Id', '==', userId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  
  const requests = [];
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const userDoc = await getDoc(doc(db, 'users', data.user1Id));
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

// Accept friend request and create conversation
export async function acceptFriendRequest(db: Firestore, friendshipId: string, currentUserId: string): Promise<string> {
  // Update friendship status
  const friendshipRef = doc(db, 'friendships', friendshipId);
  await updateDoc(friendshipRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });

  // Get friendship data to find the other user
  const friendshipDoc = await getDoc(friendshipRef);
  const friendshipData = friendshipDoc.data();
  
  if (!friendshipData) throw new Error('Friendship not found');

  const otherUserId = friendshipData.user1Id === currentUserId ? friendshipData.user2Id : friendshipData.user1Id;

  // Get both users' data
  const [currentUserDoc, otherUserDoc] = await Promise.all([
    getDoc(doc(db, 'users', currentUserId)),
    getDoc(doc(db, 'users', otherUserId))
  ]);

  if (!currentUserDoc.exists() || !otherUserDoc.exists()) {
    throw new Error('User not found');
  }

  const currentUser = currentUserDoc.data();
  const otherUser = otherUserDoc.data();

  // Create conversation
  const conversationId = `${[currentUserId, otherUserId].sort().join('_')}`;
  await setDoc(doc(db, 'conversations', conversationId), {
    participants: [currentUserId, otherUserId],
    participantDetails: {
      [currentUserId]: {
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl || null,
      },
      [otherUserId]: {
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl || null,
      },
    },
    lastMessage: '',
    lastMessageTimestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return conversationId;
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
  
  const friends: UserProfile[] = [];
  for (const friendId of friendIds) {
    const userDoc = await getDoc(doc(db, 'users', friendId));
    if (userDoc.exists()) {
      friends.push(userDoc.data() as UserProfile);
    }
  }
  
  return friends;
}
