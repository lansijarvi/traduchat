"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Paperclip, 
  Send,
  Smile,
  Mic
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2 border-t border-border bg-card">
      <div className="flex items-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hidden sm:flex">
          <Paperclip className="h-4 w-4" />
        </Button>
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[36px] max-h-32 py-2 px-3 pr-20 text-sm resize-none"
            rows={1}
          />
          <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
              <Mic className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="h-8 w-8 shrink-0"
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
