import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Phone, Video } from 'lucide-react';
import type { Chat } from '@/lib/types';
import { loggedInUser } from '@/lib/data';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  const { toast } = useToast();
  const otherUser = chat.participants.find(p => p.id !== loggedInUser.id);
  const showToast = () => toast({ title: "Feature in development" });

  return (
    <header className="flex items-center justify-between border-b p-4 shrink-0">
        <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden"/>
            {otherUser && (
                <>
                    <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <h2 className="text-lg font-semibold">{otherUser.name}</h2>
                    <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                </>
            )}
        </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={showToast}>
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={showToast}>
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={showToast}>
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
