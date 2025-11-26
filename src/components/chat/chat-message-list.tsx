"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  senderName?: string;
  senderAvatar?: string;
}

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function ChatMessageList({ messages, currentUserId }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 scroll-smooth"
      style={{ overflowAnchor: 'auto' }}
    >
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                isOwn ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isOwn && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.senderAvatar} />
                  <AvatarFallback>
                    {message.senderName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  isOwn ? "items-end" : "items-start"
                )}
              >
                {!isOwn && message.senderName && (
                  <span className="text-xs text-muted-foreground mb-1">
                    {message.senderName}
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {format(message.timestamp, "HH:mm")}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
