"use client"
import React, { useState, useEffect } from 'react';
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
import { Globe, LogOut, Search, Settings, User as UserIcon, Users } from 'lucide-react';
import { getUserConversations, type ConversationData } from '@/lib/conversation-helpers';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { AI_CONVERSATION_ID, linguaAI } from '@/lib/ai-friend';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatSidebar({ onChatSelect, selectedChatId }: ChatSidebarProps) {
    const { toast } = useToast();
    const auth = useAuth();
    const { user } = useUser();
    const db = useFirestore();
    const [conversations, setConversations] = useState<ConversationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!db || !user) return;
      
      const unsubscribe = getUserConversations(db, user.uid).then(userConvos => {
        setConversations(userConvos);
        setLoading(false);
      }).catch(error => {
        console.error('Error loading conversations:', error);
        setLoading(false);
      });
      
    }, [db, user]);

    const handleLogout = async () => {
      if (!auth) return;
        try {
            await signOut(auth);
            toast({
                title: "Logged Out",
                description: "You have been signed out successfully.",
            });
            window.location.href = '/login';
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Logout Error",
                description: error.message || "Could not log out.",
            });
        }
    }

    const aiChat = {
      id: AI_CONVERSATION_ID,
      otherUser: {
        uid: linguaAI.id,
        displayName: linguaAI.name,
        username: linguaAI.username,
        avatarUrl: linguaAI.avatarUrl,
      },
      lastMessage: 'Ready to practice your Spanish?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60)
    };

    const allChats = [
      aiChat,
      ...conversations.map(conv => {
        const otherUserId = conv.participants.find(p => p !== user?.uid);
        const otherUserDetails = otherUserId ? conv.participantDetails[otherUserId] : null;
        return {
          id: conv.id,
          otherUser: {
            uid: otherUserId,
            displayName: otherUserDetails?.displayName || 'Unknown User',
            username: otherUserDetails?.username || 'unknown',
            avatarUrl: otherUserDetails?.avatarUrl || '',
          },
          lastMessage: conv.lastMessage || 'Start chatting!',
          lastMessageAt: conv.lastMessageTimestamp,
        }
      })
    ];

  return (
    <>
      <SidebarHeader className="p-3 pb-2 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold">TraduChat</h1>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8 h-8 text-sm" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0">
        <SidebarMenu className="p-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : allChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No chats yet</div>
          ) : (
            allChats.map(chat => {
              if (!chat.otherUser) return null;
              return (
                <SidebarMenuItem key={chat.id} onClick={() => onChatSelect(chat.id)}>
                  <SidebarMenuButton
                    isActive={selectedChatId === chat.id}
                    className="h-auto p-2 justify-start hover:bg-sidebar-accent"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={chat.otherUser.avatarUrl} alt={chat.otherUser.displayName} />
                      <AvatarFallback className="text-xs">{(chat.otherUser?.displayName || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left ml-2 overflow-hidden flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate w-full">{chat.otherUser.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate w-full">{chat.lastMessage || 'Start chatting!'}</p>
                    </div>
                    <div className="ml-2 flex flex-col items-end self-start shrink-0">
                      <time className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {chat.lastMessageAt ? formatDistanceToNow(chat.lastMessageAt, { addSuffix: true }) : ''}
                      </time>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })
          )}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <Avatar className="h-7 w-7 shrink-0">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ""} />}
                    <AvatarFallback className="text-xs">{(user?.displayName || user?.email || "?")[0]}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-xs truncate">{user?.displayName || user?.email}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                  <Link href="/profile">
                    <UserIcon className="h-3.5 w-3.5"/>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                  <Link href="/friends">
                    <Users className="h-3.5 w-3.5"/>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5"/>
                </Button>
            </div>
        </div>
      </SidebarFooter>
    </>
  );
}
