import { 
  deleteDoc,
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
  getDoc,
  updateDoc,
  DocumentData,
  FieldValue
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { translateMessage, type TranslateMessageInput } from "@/ai/flows/real-time-translation";

export interface ConversationData {
  id: string;
  participants: string[];
  participantDetails: Record<string, {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    language: 'en' | 'es';
  }>;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount?: Record<string, number>;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string | null;
}

export interface MessageData {
  id: string;
  text: string;
  translatedText?: string;
  senderId: string;
  senderLanguage: 'en' | 'es';
  timestamp: Date;
  read: boolean;
  media?: MediaAttachment[];
  linkPreview?: LinkPreview;
}

export async function getConversationById(db: Firestore, conversationId: string): Promise<any> {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
        return null;
    }
    const data = conversationSnap.data();
    return { id: conversationSnap.id, ...data };
}

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

export async function sendMessage(
  db: Firestore,
  conversationId: string,
  senderId: string,
  text: string,
  senderLanguage: 'en' | 'es',
  media?: MediaAttachment[],
  linkPreview?: LinkPreview
): Promise<void> {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }
  
  const conversation = conversationSnap.data();
  const receiverId = conversation.participants?.find((id: string) => id !== senderId);
  
  let translatedText: string | undefined;
  if (receiverId && text) {
    // Get receiver's language from their profile
    const receiverRef = doc(db, 'users', receiverId);
    const receiverSnap = await getDoc(receiverRef);
    const receiverLanguage = receiverSnap.exists() ? (receiverSnap.data().language || 'en') : 'en';
    
    // Only translate if languages differ
    if (senderLanguage !== receiverLanguage) {
      try {
        const translationResult = await translateMessage({
          text,
          sourceLanguage: senderLanguage,
          targetLanguage: receiverLanguage,
        });
        translatedText = translationResult.translatedText;
      } catch (error) {
        console.error('Translation failed:', error);
      }
    }
  }

  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messageData: any = {
    text: text,
    senderId,
    senderLanguage,
    timestamp: serverTimestamp(),
    read: false,
  };

  if (translatedText) {
    messageData.translatedText = translatedText;
  }

  if (media && media.length > 0) {
    messageData.media = media;
  }

  if (linkPreview) {
    messageData.linkPreview = linkPreview;
  }
  
  await addDoc(messagesRef, messageData);
  
  const lastMessageText = text || (media && media.length > 0 ? '📎 Attachment' : '🔗 Link');
  
  // Build update object
  const updateData: any = {
    lastMessage: lastMessageText,
    lastMessageTimestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  if (receiverId) {
    updateData["unreadCount." + receiverId] = (conversation.unreadCount?.[receiverId] || 0) + 1;
  }
  
  await setDoc(conversationRef, updateData, { merge: true });
}

export async function createConversation(
  db: Firestore,
  participant1Id: string,
  participant2Id: string,
  participant1Details: { username: string; displayName: string; avatarUrl?: string, language?: 'en' | 'es' },
  participant2Details: { username: string; displayName: string; avatarUrl?: string, language?: 'en' | 'es' }
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
        language: participant1Details.language || 'en',
      },
      [participant2Id]: {
        username: participant2Details.username,
        displayName: participant2Details.displayName,
        avatarUrl: participant2Details.avatarUrl || null,
        language: participant2Details.language || 'en',
      },
    },
    lastMessage: '',
    lastMessageTimestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return conversationId;
}

export async function acceptFriendRequest(db: Firestore, friendshipId: string, currentUserId: string): Promise<string> {
  const friendshipRef = doc(db, 'friendships', friendshipId);
  const friendshipSnap = await getDoc(friendshipRef);

  if (!friendshipSnap.exists()) throw new Error('Friendship not found');

  const friendship = friendshipSnap.data();
  if (friendship.toUserId !== currentUserId) throw new Error('Not authorized to accept this request.');

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

  const conversationId = await createConversation(
    db,
    fromUserId,
    toUserId,
    {
      username: fromUserData.username,
      displayName: fromUserData.displayName,
      avatarUrl: fromUserData.avatarUrl,
      language: fromUserData.language
    },
    {
      username: toUserData.username,
      displayName: toUserData.displayName,
      avatarUrl: toUserData.avatarUrl,
      language: toUserData.language
    }
  );

  return conversationId;
}

export async function deleteMessage(
  db: Firestore,
  conversationId: string,
  messageId: string
): Promise<void> {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await deleteDoc(messageRef);
}

export async function editMessage(
  db: Firestore,
  conversationId: string,
  messageId: string,
  newText: string,
  senderLanguage: 'en' | 'es'
): Promise<void> {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnap = await getDoc(conversationRef);
  
  if (!conversationSnap.exists()) {
    throw new Error('Conversation not found');
  }

  const conversation = conversationSnap.data();
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);
  
  if (!messageSnap.exists()) {
    throw new Error('Message not found');
  }

  const messageData = messageSnap.data();
  const receiverId = conversation.participants?.find((id: string) => id !== messageData.senderId);
  
  let translatedText: string | undefined;
  
  if (receiverId && newText) {
    const receiverRef = doc(db, 'users', receiverId);
    const receiverSnap = await getDoc(receiverRef);
    const receiverLanguage = receiverSnap.exists() ? (receiverSnap.data().language || 'en') : 'en';

    if (senderLanguage !== receiverLanguage) {
      try {
        const translation = await translateMessage({
          text: newText,
          sourceLanguage: senderLanguage,
          targetLanguage: receiverLanguage,
        });
        translatedText = translation.translatedText;
      } catch (error) {
        console.error('Translation failed during edit:', error);
      }
    }
  }

  const updateData: any = {
    text: newText,
    edited: true,
    editedAt: serverTimestamp(),
  };

  if (translatedText) {
    updateData.translatedText = translatedText;
  }

  await updateDoc(messageRef, updateData);
}