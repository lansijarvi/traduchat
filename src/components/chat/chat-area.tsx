"use client";

import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageList, type Message } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageSquare, Loader2 } from "lucide-react";
import { 
  getConversationMessages, 
  sendMessage, 
  getConversationById 
} from "@/lib/conversation-helpers";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  chatId: string | null;
}

export function ChatArea({ chatId }: ChatAreaProps) {
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
      return;
    }

    setLoading(true);
    getConversationById(db, chatId)
      .then(setConversation)
      .catch((error) => {
        console.error("Error loading conversation:", error);
        toast({
          variant: "destructive",
          title: "Error loading conversation",
          description: error.message,
        });
      })
      .finally(() => setLoading(false));
  }, [db, chatId]);

  // Real-time messages listener
  useEffect(() => {
    if (!db || !chatId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", chatId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
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
  }, [db, chatId]);

  const handleSendMessage = async (content: string) => {
    if (!db || !user || !chatId) return;

    try {
      await sendMessage(db, chatId, user.uid, content);
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
      <div className="flex h-full flex-col items-center justify-center bg-background text-center text-muted-foreground p-8">
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
    <div className="flex h-full flex-col">
      {conversation && <ChatHeader conversation={conversation} />}
      <ChatMessageList messages={messages} currentUserId={user?.uid || ""} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
