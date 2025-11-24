"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Mic, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { chatWithLingua } from '@/ai/flows/ai-chat-flow';
import { AI_CONVERSATION_ID } from '@/lib/ai-friend';

interface MessageInputProps {
  chatId?: string | null;
  onMessageSent?: (userMsg: string, aiResponse?: string) => void;
}

export function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem('message') as HTMLInputElement;
    const messageText = input.value.trim();
    
    if (!messageText) return;

    const isAIChat = chatId === AI_CONVERSATION_ID;

    if (isAIChat) {
      setIsSending(true);
      try {
        const result = await chatWithLingua({
          userMessage: messageText,
          userLanguage: 'en',
        });

        input.value = "";
        
        if (onMessageSent) {
          onMessageSent(messageText, result.response);
        }

        toast({
          title: "Message sent!",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not send message.",
        });
      } finally {
        setIsSending(false);
      }
    } else {
      console.log("Sending message:", messageText);
      toast({
        title: "Message Sent (Mock)",
        description: "Real messaging coming soon!",
      });
      input.value = "";
    }
  };

  return (
    <div className="border-t p-4 shrink-0 bg-background">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" disabled={isSending}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input 
          name="message" 
          placeholder={isSending ? "Lingua is typing..." : "Type a message..."} 
          className="flex-1 bg-input" 
          autoComplete="off"
          disabled={isSending}
        />
        <Button type="button" variant="ghost" size="icon" disabled={isSending}>
          <Mic className="h-5 w-5" />
        </Button>
        <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90" disabled={isSending}>
          <Send className="h-5 w-5 text-accent-foreground" />
        </Button>
      </form>
    </div>
  );
}
