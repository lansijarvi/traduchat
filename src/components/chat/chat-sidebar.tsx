"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, LogOut, Search, Settings, User as UserIcon, Users, MessageSquare } from 'lucide-react';
import { getUserConversations, type ConversationData } from '@/lib/conversation-helpers';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
    const [userLanguage, setUserLanguage] = useState('en');

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
    
    const fetchUserLanguage = useCallback(async () => {
        if (!db || !user) return;
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            setUserLanguage(docSnap.data().language || 'en');
        }
    }, [db, user]);

    useEffect(() => {
        fetchUserLanguage();
    }, [fetchUserLanguage]);


    const handleLanguageChange = async (newLanguage: 'en' | 'es') => {
        if (!db || !user) return;
        setUserLanguage(newLanguage);
        const userRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userRef, { language: newLanguage });
            toast({
                title: "Language Updated",
                description: `Your preferred language is now ${newLanguage === 'en' ? 'English' : 'Español'}.`
            });
        } catch (error) {
            console.error("Failed to update language:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update your language preference.'
            });
        }
    };

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

    const allChats = conversations.map(conv => {
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
      });

  return (
    <>
      <SidebarHeader className="p-3 pb-2 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">TraduChat</h1>
            </div>
            <Select value={userLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-auto h-8 text-xs border-none bg-sidebar-accent">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="es">ES</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0">
         <SidebarMenu className="p-2">
            <SidebarMenuItem>
              <Button asChild variant="default" size="lg" className="w-full justify-start">
                  <Link href="/friends">
                      <Users /> Friends & Requests
                  </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button asChild variant="secondary" size="lg" className="w-full justify-start">
                  <Link href="/profile">
                      <UserIcon /> Your Profile
                  </Link>
              </Button>
            </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSeparator />

        <div className="p-2 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <h2 className="font-semibold text-sm">Chats</h2>
        </div>

        <SidebarMenu className="px-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : allChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No chats yet. Add a friend to start chatting!</div>
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5"/>
            </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
