import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { translateMessage } from '@/ai/flows/real-time-translation';

export interface ConversationData {
  id: string;
  participants: string[];
  participantDetails: Record<string, {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  lastMessage: string;
  lastMessageTimestamp: Date;
}

export interface MessageData {
  id: string;
  text: string;
  translatedText?: string;
  senderId: string;
  senderLanguage: 'en' | 'es';
  timestamp: Date;
  read: boolean;
}

// Get user conversations
export async function getUserConversations(db: Firestore, userId: string): Promise<ConversationData[]> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations: ConversationData[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastMessageTimestamp: doc.data().lastMessageTimestamp?.toDate() || new Date(),
        } as ConversationData));
        unsubscribe();
        resolve(conversations);
      },
      reject
    );
  });
}

// Listen to messages in a conversation
export function listenToMessages(
  db: Firestore,
  conversationId: string,
  callback: (messages: MessageData[]) => void
): () => void {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: MessageData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    } as MessageData));
    callback(messages);
  });
}

// Send message with automatic translation
export async function sendMessage(
  db: Firestore,
  conversationId: string,
  senderId: string,
  text: string,
  senderLanguage: 'en' | 'es'
): Promise<void> {
  // Get conversation to find receiver's language
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data();
  const receiverId = conversation.participants.find((id: string) => id !== senderId);
  
  // Get receiver's language preference
  const receiverRef = doc(db, 'users', receiverId);
  const receiverSnap = await getDoc(receiverRef);
  const receiverLanguage = receiverSnap.exists() ? (receiverSnap.data().language || 'en') : 'en';

  // Auto-translate if languages differ
  let translatedText: string | undefined;
  if (senderLanguage !== receiverLanguage) {
    try {
      const translation = await translateMessage({
        text,
        fromLang: senderLanguage,
        toLang: receiverLanguage,
      });
      translatedText = translation.translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }

  // Save message with translation
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(messagesRef, {
    text,
    translatedText,
    senderId,
    senderLanguage,
    timestamp: serverTimestamp(),
    read: false,
  });

  // Update conversation last message
  await setDoc(conversationRef, {
    lastMessage: text,
    lastMessageTimestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Create a new conversation
export async function createConversation(
  db: Firestore,
  participant1Id: string,
  participant2Id: string,
  participant1Details: { username: string; displayName: string; avatarUrl?: string },
  participant2Details: { username: string; displayName: string; avatarUrl?: string }
): Promise<string> {
  const conversationId = `${[participant1Id, participant2Id].sort().join('_')}`;
  const conversationRef = doc(db, 'conversations', conversationId);

  await setDoc(conversationRef, {
    participants: [participant1Id, participant2Id],
    participantDetails: {
      [participant1Id]: {
        username: participant1Details.username,
        displayName: participant1Details.displayName,
        avatarUrl: participant1Details.avatarUrl || null,
      },
      [participant2Id]: {
        username: participant2Details.username,
        displayName: participant2Details.displayName,
        avatarUrl: participant2Details.avatarUrl || null,
      },
    },
    lastMessage: '',
    lastMessageTimestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return conversationId;
}
