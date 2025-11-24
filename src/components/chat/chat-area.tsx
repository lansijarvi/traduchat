"use client";
import React, { useState } from 'react';
import { chats, loggedInUser } from '@/lib/data';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { MessageSquare } from 'lucide-react';
import { AI_FRIEND_ID } from '@/lib/ai-friend';
import type { Message } from '@/lib/types';

interface ChatAreaProps {
  chatId: string | null;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const chat = chats.find(c => c.id === chatId);
  const [dynamicMessages, setDynamicMessages] = useState<Record<string, Message[]>>({});

  const allMessages = chat 
    ? [...chat.messages, ...(dynamicMessages[chatId] || [])]
    : [];

  const handleMessageSent = (userMsg: string, aiResponse?: string) => {
    if (!chatId) return;

    const newMessages: Message[] = [
      {
        id: `msg_${Date.now()}`,
        text: userMsg,
        senderId: loggedInUser.id,
        timestamp: new Date(),
        lang: 'en',
      }
    ];

    if (aiResponse) {
      newMessages.push({
        id: `ai_${Date.now()}`,
        text: aiResponse,
        senderId: AI_FRIEND_ID,
        timestamp: new Date(),
        lang: 'es',
      });
    }

    setDynamicMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), ...newMessages],
    }));
  };

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card text-center text-muted-foreground p-8">
        <MessageSquare className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Select a chat to start messaging</h2>
        <p className="mt-2 max-w-sm">Choose Lingua to practice Spanish!</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <ChatHeader chat={chat} />
      <MessageList messages={allMessages} />
      <MessageInput chatId={chatId} onMessageSent={handleMessageSent} />
    </div>
  );
}
