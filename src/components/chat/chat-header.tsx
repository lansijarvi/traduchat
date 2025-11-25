"use client"
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Phone, 
  Video, 
  Search,
  Menu
} from 'lucide-react';
import { useSidebar } from "@/components/ui/sidebar";

interface ChatHeaderProps {
  name: string;
  avatarUrl?: string;
  status?: string;
}

export function ChatHeader({ name, avatarUrl, status = 'online' }: ChatHeaderProps) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="flex items-center justify-between p-2 border-b border-border bg-card">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 md:hidden shrink-0" 
          onClick={toggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="text-xs">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <h2 className="font-semibold text-sm truncate">{name}</h2>
          {status && <span className="text-[10px] text-muted-foreground">{status}</span>}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Search className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Phone className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Video className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
