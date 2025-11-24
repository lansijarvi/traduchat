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
import { chats as mockChats, loggedInUser } from '@/lib/data';
import { getUserConversations, type Conversation } from '@/lib/conversation-helpers';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AI_CONVERSATION_ID } from '@/lib/ai-friend';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatSidebar({ onChatSelect, selectedChatId }: ChatSidebarProps) {
    const { toast } = useToast();
    const auth = useAuth();
    const { user } = useUser();
    const db = useFirestore();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!db || !user) return;
      
      const loadConversations = async () => {
        try {
          const userConvos = await getUserConversations(db, user.uid);
          setConversations(userConvos);
        } catch (error) {
          console.error('Error loading conversations:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadConversations();
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

    // Combine AI chat with real conversations
    const aiChat = mockChats.find(c => c.id === AI_CONVERSATION_ID);
    const allChats = [
      ...(aiChat ? [aiChat] : []),
      ...conversations.map(conv => {
        const otherUserId = conv.participants.find(p => p !== user?.uid);
        const otherUserDetails = otherUserId ? conv.participantDetails[otherUserId] : null;
        
        return {
          id: conv.id,
          participants: [
            loggedInUser,
            {
              id: otherUserId || '',
              name: otherUserDetails?.displayName || 'Unknown',
              username: otherUserDetails?.username || 'unknown',
              avatarUrl: otherUserDetails?.avatarUrl || '',
            }
          ],
          lastMessage: conv.lastMessage,
          lastMessageTimestamp: conv.lastMessageTimestamp.toDate(),
          unreadCount: 0,
          messages: [],
        };
      })
    ];

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
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
          ) : (
            allChats.map(chat => {
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
                      <p className="text-sm text-muted-foreground truncate w-full">{chat.lastMessage || 'Start chatting!'}</p>
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
            })
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-9 w-9">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ""} />}
                    <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold truncate">{user?.displayName || user?.email}</p>
            </div>
            <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon">
                  <Link href="/profile">
                    <UserIcon className="h-5 w-5"/>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon">
                  <Link href="/friends">
                    <Users className="h-5 w-5"/>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast({ title: "Feature in development" })}><Settings className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5"/></Button>
            </div>
        </div>
      </SidebarFooter>
    </>
  );
}
