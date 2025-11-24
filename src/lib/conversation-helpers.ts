import { collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, updateDoc, serverTimestamp, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface Conversation {
  id: string;
  participants: any[];
  createdAt: Date;
  lastMessageAt: Date;
}

export interface ConversationData {
  id: string;
  otherUser: {
    uid: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage?: string;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  senderName?: string;
  senderAvatar?: string;
}

export async function getOrCreateConversation(db: Firestore, userId1: string, userId2: string): Promise<string> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId1));
  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find(d => d.data().participants.includes(userId2));
  if (existing) return existing.id;
  const newConv = await addDoc(conversationsRef, {
    participants: [userId1, userId2],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp()
  });
  return newConv.id;
}

export async function getUserConversations(db: Firestore, userId: string): Promise<ConversationData[]> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);
  const conversations: ConversationData[] = [];
  for (const convDoc of snapshot.docs) {
    const data = convDoc.data();
    const otherUserId = data.participants.find((id: string) => id !== userId);
    if (!otherUserId) continue;
    const userDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!userDoc.exists()) continue;
    const userData = userDoc.data();
    conversations.push({
      id: convDoc.id,
      otherUser: {
        uid: otherUserId,
        username: userData.username,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
      },
      lastMessage: data.lastMessage,
      lastMessageAt: data.lastMessageAt?.toDate() || data.createdAt?.toDate() || new Date(),
    });
  }
  return conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
}

export async function sendMessage(db: Firestore, conversationId: string, senderId: string, content: string): Promise<void> {
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    conversationId,
    senderId,
    content,
    timestamp: serverTimestamp(),
  });
  const conversationRef = doc(db, 'conversations', conversationId);
  await setDoc(conversationRef, {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
  }, { merge: true });
}

export async function getMessages(db: Firestore, conversationId: string): Promise<Message[]> {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      timestamp: data.timestamp?.toDate() || new Date(),
    };
  });
}

export function listenToMessages(db: Firestore, conversationId: string, callback: (messages: Message[]) => void): () => void {
  const messagesRef = collection(db, 'messages');
  const q = query(messagesRef, where('conversationId', '==', conversationId), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
      };
    });
    callback(messages);
  });
}

export async function getConversationById(db: Firestore, conversationId: string): Promise<Conversation | null> {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);
    if (!conversationSnap.exists()) return null;
    const data = conversationSnap.data();
    const participantPromises = data.participants.map(async (uid: string) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { uid, username: userData.username, displayName: userData.displayName, avatarUrl: userData.avatarUrl };
      }
      return null;
    });
    const participants = (await Promise.all(participantPromises)).filter(Boolean);
    return {
      id: conversationSnap.id,
      participants,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw error;
  }
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
  
  const otherUserId = friendshipData.fromUserId === currentUserId 
    ? friendshipData.toUserId 
    : friendshipData.fromUserId;
  
  // Create conversation with simple structure
  const conversationId = `${[currentUserId, otherUserId].sort().join('_')}`;
  await setDoc(doc(db, 'conversations', conversationId), {
    participants: [currentUserId, otherUserId],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });
  
  return conversationId;
}