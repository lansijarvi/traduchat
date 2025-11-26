"use client";

import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageList, type Message } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageSquare, Loader2 } from "lucide-react";
import { 
  sendMessage, 
  getConversationById 
} from "@/lib/conversation-helpers";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
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

        const otherUserId = conv.participants.find(p => p !== user?.uid);
        const otherUserDetails = conv.participantDetails[otherUserId];

        setConversation({
            ...conv,
            name: otherUserDetails?.displayName,
            avatarUrl: otherUserDetails?.avatarUrl,
            otherUserLanguage: otherUserDetails?.language || 'en',
        });

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

          // Show translated text if available and user is receiver
          let contentToShow = data.text;
          if (!isCurrentUser && data.translatedText) {
            contentToShow = data.translatedText;
          }

          return {
            id: doc.id,
            senderId: senderId,
            content: contentToShow,
            originalContent: data.text,
            wasTranslated: !isCurrentUser && !!data.translatedText,
            timestamp: data.timestamp?.toDate() || new Date(),
            senderName: senderDetails?.displayName,
            senderAvatar: senderDetails?.avatarUrl,
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

  const handleSendMessage = async (content: string) => {
    if (!db || !user || !chatId) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userLanguage = userDoc.exists() ? (userDoc.data().language || 'en') : 'en';
      
      await sendMessage(db, chatId, user.uid, content, userLanguage);
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
      <ChatMessageList messages={messages} currentUserId={user?.uid || ""} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
