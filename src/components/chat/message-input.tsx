"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Mic, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function MessageInput() {
  const { toast } = useToast();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem('message') as HTMLInputElement;
    if (input.value.trim()) {
        console.log("Sending message:", input.value);
        toast({
            title: "Message Sent (Mock)",
            description: "This is a UI demo. Messages are not actually sent.",
        });
        input.value = "";
    }
  };

  return (
    <div className="border-t p-4 shrink-0 bg-background">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => toast({ title: "Feature in development" })}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input name="message" placeholder="Type a message..." className="flex-1 bg-input" autoComplete="off" />
        <Button type="button" variant="ghost" size="icon" onClick={() => toast({ title: "Feature in development" })}>
          <Mic className="h-5 w-5" />
        </Button>
        <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90">
          <Send className="h-5 w-5 text-accent-foreground" />
        </Button>
      </form>
    </div>
  );
}
