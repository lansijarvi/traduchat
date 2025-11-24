"use client"
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Globe, LogOut, Search, Settings } from 'lucide-react';
import { chats, loggedInUser } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatSidebar({ onChatSelect, selectedChatId }: ChatSidebarProps) {
    const { toast } = useToast();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
      if (!auth) return;
        try {
            await signOut(auth);
            toast({
                title: "Logged Out",
                description: "You have been signed out successfully.",
            });
            router.push('/login');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Logout Error",
                description: error.message || "Could not log out.",
            });
        }
    }

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">TraduChat</h1>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-9" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarMenu className="p-4 pt-0">
          {chats.map(chat => {
            const otherUser = chat.participants.find(p => p.id !== loggedInUser.id);
            if (!otherUser) return null;
            return (
              <SidebarMenuItem key={chat.id} onClick={() => onChatSelect(chat.id)}>
                <SidebarMenuButton
                  isActive={selectedChatId === chat.id}
                  className="h-auto p-3 justify-start"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left ml-2 overflow-hidden">
                    <p className="font-semibold truncate w-full">{otherUser.name}</p>
                    <p className="text-sm text-muted-foreground truncate w-full">{chat.lastMessage}</p>
                  </div>
                  <div className="ml-auto flex flex-col items-end self-start shrink-0">
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(chat.lastMessageTimestamp, { addSuffix: true })}
                    </time>
                    {chat.unreadCount > 0 && (
                      <span className={cn("mt-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-accent-foreground", chat.unreadCount > 0 ? "bg-accent" : "bg-transparent")}>
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={loggedInUser.avatarUrl} alt={loggedInUser.name} />
                    <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{loggedInUser.name}</p>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
                
                  <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5"/></Button>
                
            </div>
        </div>
      </SidebarFooter>
    </>
  );
}
