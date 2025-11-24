import { collection, query, where, getDocs, getDoc, addDoc, doc, setDoc, serverTimestamp, Timestamp, orderBy, onSnapshot } from "firebase/firestore";
import type { Firestore } from 'firebase/firestore';

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, { username: string; avatarUrl?: string; displayName: string }>;
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderLanguage: 'en' | 'es';
  timestamp: Timestamp;
  read: boolean;
}

// Create or get existing conversation between two users
export async function getOrCreateConversation(
  db: Firestore,
  user1Id: string,
  user2Id: string,
  user1Details: { username: string; avatarUrl?: string; displayName: string },
  user2Details: { username: string; avatarUrl?: string; displayName: string }
): Promise<string> {
  // Check if conversation already exists
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', user1Id)
  );
  
  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.participants.includes(user2Id);
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Create new conversation
  const docRef = await addDoc(conversationsRef, {
    participants: [user1Id, user2Id],
    participantDetails: {
      [user1Id]: user1Details,
      [user2Id]: user2Details,
    },
    lastMessage: '',
    lastMessageTimestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

// Get all conversations for a user
export async function getUserConversations(db: Firestore, userId: string): Promise<Conversation[]> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Conversation));
}

// Send a message
export async function sendMessage(
  db: Firestore,
  conversationId: string,
  senderId: string,
  text: string,
  senderLanguage: 'en' | 'es'
): Promise<string> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messageDoc = await addDoc(messagesRef, {
    text,
    senderId,
    senderLanguage,
    timestamp: serverTimestamp(),
    read: false,
  });
  
  // Update conversation's last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await setDoc(conversationRef, {
    lastMessage: text,
    lastMessageTimestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  
  return messageDoc.id;
}

// Get messages for a conversation
export async function getMessages(db: Firestore, conversationId: string): Promise<Message[]> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Message));
}

// Listen to messages in real-time
export function listenToMessages(
  db: Firestore,
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    callback(messages);
  });
  
  return unsubscribe;
}

export async function getConversationById(
  db: Firestore,
  conversationId: string
): Promise<Conversation | null> {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return null;
    }
    
    const data = conversationSnap.data();
    
    // Fetch participant details
    const participantPromises = data.participants.map(async (uid: string) => {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid,
          username: userData.username,
          displayName: userData.displayName,
          avatarUrl: userData.avatarUrl,
        };
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
