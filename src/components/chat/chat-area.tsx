"use client";

import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageList, type Message } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageSquare, Loader2 } from "lucide-react";
import { 
  sendMessage, 
  getConversationById,
  deleteMessage,
  type MediaAttachment,
  type LinkPreview
} from "@/lib/conversation-helpers";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  chatId: string | null;
  onBack?: () => void;
}

export function ChatArea({ chatId, onBack }: ChatAreaProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserLanguage, setCurrentUserLanguage] = useState<string>("en");

  // Load conversation details
  useEffect(() => {
    if (!db || !chatId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    getConversationById(db, chatId)
      .then((conv) => {
        if (!conv) {
          setConversation(null);
          return;
        }

        const otherUserId = conv.participants.find((p: string) => p !== user?.uid);
        const otherUserDetails = conv.participantDetails[otherUserId];

        setConversation({
          ...conv,
          name: otherUserDetails?.displayName,
          avatarUrl: otherUserDetails?.avatarUrl,
          otherUserLanguage: otherUserDetails?.language || 'en',
        });

        // Mark conversation as read
        if (user?.uid && db) {
          const conversationRef = doc(db, "conversations", chatId);
          updateDoc(conversationRef, {
            ["unreadCount." + user.uid]: 0
          }).catch(err => console.error("Error marking as read:", err));
        }
      })
      .catch((error) => {
        console.error("Error loading conversation:", error);
        toast({
          variant: "destructive",
          title: "Error loading conversation",
          description: error.message,
        });
      })
      .finally(() => setLoading(false));
  }, [db, chatId, user]);

  // Listen to other user's profile for real-time language updates
  useEffect(() => {
    if (!db || !conversation) return;
    
    const otherUserId = conversation.participants?.find((p: string) => p !== user?.uid);
    if (!otherUserId) return;
    
    const userRef = doc(db, "users", otherUserId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        setConversation((prev: any) => ({
          ...prev,
          otherUserLanguage: userData.language || "en",
        }));
      }
    });
    
    return () => unsubscribe();
  }, [db, conversation?.participants, user?.uid]);

  // Real-time messages listener
  useEffect(() => {
    if (!db || !chatId || !conversation) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "conversations", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const senderId = data.senderId;
          const senderDetails = conversation.participantDetails[senderId];
          const isCurrentUser = senderId === user?.uid;

          let contentToShow = data.text;
          let originalContent = data.text;
          let translatedContent = data.translatedText;
          let wasTranslated = false;

          if (!isCurrentUser && data.translatedText) {
            contentToShow = data.translatedText;
            originalContent = data.text;
            wasTranslated = true;
          } else if (isCurrentUser && data.translatedText) {
            contentToShow = data.text;
            translatedContent = data.translatedText;
          }

          return {
            id: doc.id,
            senderId: senderId,
            content: contentToShow,
            originalContent: originalContent,
            translatedContent: translatedContent,
            wasTranslated: wasTranslated,
            timestamp: data.timestamp?.toDate() || new Date(),
            senderName: senderDetails?.displayName,
            senderAvatar: senderDetails?.avatarUrl,
            media: data.media || undefined,
            linkPreview: data.linkPreview || undefined,
          };
        });
        setMessages(msgs);
      },
      (error) => {
        console.error("Error listening to messages:", error);
        toast({
          variant: "destructive",
          title: "Error loading messages",
          description: error.message,
        });
      }
    );

    return () => unsubscribe();
  }, [db, chatId, conversation, user?.uid, toast]);

  const handleSendMessage = async (content: string, media?: MediaAttachment[], linkPreview?: LinkPreview) => {
    if (!db || !user || !chatId) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userLanguage = userDoc.exists() ? (userDoc.data().language || 'en') : 'en';
      
      await sendMessage(db, chatId, user.uid, content, userLanguage, media, linkPreview);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error.message,
      });
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!db || !chatId) return;
    
    try {
      await deleteMessage(db, chatId, messageId);
      toast({
        title: "Message deleted",
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete message",
        description: error.message,
      });
    }
  };

  if (!chatId) {
    return (
      <div className="hidden md:flex h-full flex-col items-center justify-center bg-background text-center text-muted-foreground p-8">
        <MessageSquare className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Select a chat to start messaging</h2>
        <p className="mt-2 max-w-sm">Choose a conversation from the sidebar</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {conversation && (
        <ChatHeader 
          name={conversation.name} 
          avatarUrl={conversation.avatarUrl} 
          onBack={onBack}
          language={conversation.otherUserLanguage}
        />
      )}
      <ChatMessageList 
        messages={messages} 
        currentUserId={user?.uid || ""} 
        onDeleteMessage={handleDeleteMessage}
        currentUserLanguage={currentUserLanguage}
      />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
