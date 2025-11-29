"use client"
import React, { useState } from 'react';
import { loggedInUser, users } from '@/lib/data';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { translateMessage, type TranslateMessageInput } from '@/ai/flows/real-time-translation';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { toast } = useToast();
  const isMyMessage = message.senderId === loggedInUser.id;
  const sender = users.find(u => u.id === message.senderId);
  
  const [currentText, setCurrentText] = useState(message.text);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | undefined>(message.translatedText);
  
  const originalLang = message.lang;
  const targetLang = originalLang === 'en' ? 'es' : 'en';

  const handleTranslate = async () => {
    if (isLoading) return;

    if (isTranslated) {
      setCurrentText(message.text);
      setIsTranslated(false);
      return;
    }
    
    if (translatedText) {
      setCurrentText(translatedText);
      setIsTranslated(true);
      return;
    }

    setIsLoading(true);
    try {
        const input: TranslateMessageInput = {
            text: message.text,
            sourceLanguage: originalLang,
            targetLanguage: targetLang,
        };
        const result = await translateMessage(input);
        if (result && result.translatedText) {
            setTranslatedText(result.translatedText);
            setCurrentText(result.translatedText);
            setIsTranslated(true);
        } else {
            throw new Error("Translation failed.");
        }
    } catch (error) {
        console.error("Translation error:", error);
        toast({
            variant: "destructive",
            title: "Translation Error",
            description: "Could not translate message.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className={cn('group flex w-full items-start gap-3', isMyMessage ? 'justify-end' : 'justify-start')}>
      {!isMyMessage && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{(sender?.name?.[0] || "U")}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col max-w-[75%]', isMyMessage ? 'items-end' : 'items-start')}>
        <div className={cn(
          'relative rounded-2xl p-3 text-sm shadow-md break-words',
          isMyMessage
            ? 'bg-message-sender text-[#001F3F] rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
        )}>
          {currentText}
           <Button
            variant="ghost"
            size="icon"
            onClick={handleTranslate}
            disabled={isLoading}
            className={cn(
                "absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-background/80 backdrop-blur-sm hover:bg-background",
                isMyMessage ? "" : ""
            )}>
              <Globe className={cn("h-3.5 w-3.5", isLoading ? "animate-spin" : "", isTranslated ? "text-cyan" : "text-muted-foreground")} />
           </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
      </div>
      {isMyMessage && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} />
          <AvatarFallback>{(sender?.name?.[0] || "U")}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
