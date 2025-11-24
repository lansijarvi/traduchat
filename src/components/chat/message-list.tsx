"use client";
import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="flex flex-col gap-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}
