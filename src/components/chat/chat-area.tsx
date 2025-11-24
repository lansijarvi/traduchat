import React from 'react';
import { chats } from '@/lib/data';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { MessageSquare } from 'lucide-react';

interface ChatAreaProps {
  chatId: string | null;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const chat = chats.find(c => c.id === chatId);

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card text-center text-muted-foreground p-8">
        <MessageSquare className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Select a chat to start messaging</h2>
        <p className="mt-2 max-w-sm">You can search for friends and start new conversations from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <ChatHeader chat={chat} />
      <MessageList messages={chat.messages} />
      <MessageInput />
    </div>
  );
}
