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
import { translateMessage, type TranslateMessageInput } from '@/ai/flows/real-time-translation';

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

export async function getConversationById(db: Firestore, conversationId: string): Promise<any> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
        // Special handling for AI chat
        if (conversationId === 'ai_chat') {
            return {
                id: 'ai_chat',
                name: 'Lingua',
                avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=lingua&backgroundColor=b6e3f4'
            };
        }
        return null;
    }
    const data = conversationSnap.data();
    return { id: conversationSnap.id, ...data };
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
export function getConversationMessages(
  db: Firestore,
  conversationId: string,
  callback: (messages: MessageData[]) => void
): () => void {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: MessageData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().content || doc.data().text,
      translatedText: doc.data().translatedText,
      senderId: doc.data().senderId,
      senderLanguage: doc.data().senderLanguage || 'en',
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      read: doc.data().read || false,
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

  console.log('Translation check:', { senderLanguage, receiverLanguage, text });

  // Auto-translate if languages differ
  let translatedText: string | undefined;
  if (senderLanguage !== receiverLanguage && receiverLanguage) {
    try {
      console.log('Translating from', senderLanguage, 'to', receiverLanguage);
      const input: TranslateMessageInput = {
        text,
        sourceLanguage: senderLanguage,
        targetLanguage: receiverLanguage,
      };
      const translation = await translateMessage(input);
      translatedText = translation.translatedText;
      console.log('Translation result:', translatedText);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  }

  // Save message to top-level messages collection (matching old structure)
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    content: text,
    translatedText,
    senderId,
    senderLanguage,
    conversationId,
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

export async function acceptFriendRequest(db: Firestore, friendshipId: string, currentUserId: string): Promise<string> {
  const friendshipRef = doc(db, 'friendships', friendshipId);
  const friendshipSnap = await getDoc(friendshipRef);

  if (!friendshipSnap.exists()) throw new Error('Friendship not found');

  const friendship = friendshipSnap.data();
  if (friendship.toUserId !== currentUserId) throw new Error('Not authorized');

  await updateDoc(friendshipRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });

  const fromUserId = friendship.fromUserId;
  const toUserId = friendship.toUserId;

  const [fromUserDoc, toUserDoc] = await Promise.all([
    getDoc(doc(db, 'users', fromUserId)),
    getDoc(doc(db, 'users', toUserId)),
  ]);

  if (!fromUserDoc.exists() || !toUserDoc.exists()) {
    throw new Error('User not found');
  }

  const fromUserData = fromUserDoc.data();
  const toUserData = toUserDoc.data();

  return await createConversation(
    db,
    fromUserId,
    toUserId,
    { username: fromUserData.username, displayName: fromUserData.displayName, avatarUrl: fromUserData.avatarUrl },
    { username: toUserData.username, displayName: toUserData.displayName, avatarUrl: toUserData.avatarUrl }
  );
}
