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
import { Globe, LogOut, Archive, Trash2, MessageSquare, Users, User as UserIcon } from 'lucide-react';
import { getUserConversations, type ConversationData } from '@/lib/conversation-helpers';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { QuickPhrasesPanel } from './quick-phrases-panel';
import { UserProfileModal } from "@/components/user-profile-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState<'chats' | 'archived'>('chats');

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
                description: 'Failed to update language preference.'
            });
        }
    };

    const handleArchiveConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!db || !user) return;

        try {
            const convRef = doc(db, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);
            const currentArchived = convSnap.data()?.archived || {};
            
            await updateDoc(convRef, {
                [`archived.${user.uid}`]: !currentArchived[user.uid]
            });

            // Refresh conversations
            const userConvos = await getUserConversations(db, user.uid);
            setConversations(userConvos);

            toast({
                title: currentArchived[user.uid] ? "Unarchived" : "Archived",
                description: currentArchived[user.uid] 
                    ? "Conversation moved back to chats" 
                    : "Conversation archived successfully"
            });
        } catch (error) {
            console.error('Error archiving conversation:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to archive conversation.'
            });
        }
    };

    const handleDeleteConversation = async () => {
        if (!db || !conversationToDelete) return;

        try {
            // Delete all messages in the conversation
            const messagesRef = collection(db, 'conversations', conversationToDelete, 'messages');
            const messagesSnap = await getDocs(messagesRef);
            const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete the conversation document
            await deleteDoc(doc(db, 'conversations', conversationToDelete));

            // Refresh conversations
            if (user) {
                const userConvos = await getUserConversations(db, user.uid);
                setConversations(userConvos);
            }

            // Clear selection if deleted conversation was selected
            if (selectedChatId === conversationToDelete) {
                onChatSelect('');
            }

            toast({
                title: "Deleted",
                description: "Conversation deleted permanently"
            });
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete conversation.'
            });
        } finally {
            setDeleteDialogOpen(false);
            setConversationToDelete(null);
        }
    };



    const handleAvatarClick = async (userId: string) => {
        if (!db) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setSelectedUser({
                    uid: userId,
                    displayName: userData.displayName || 'Unknown User',
                    username: userData.username,
                    bio: userData.bio,
                    avatarUrl: userData.avatarUrl,
                    country: userData.country,
                    language: userData.language,
                    createdAt: userData.createdAt?.toDate(),
                    gallery: userData.gallery || { photos: [], videos: [] },
                });
                setProfileModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const handleLogout = async () => {
      if (!auth) return;
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to sign out.',
        });
      }
    };

    const allChats = conversations
      .filter(conv => {
        const isArchived = conv.archived?.[user?.uid || ''] || false;
        return currentTab === 'archived' ? isArchived : !isArchived;
      })
      .map(conv => {
        const otherUserId = conv.participants.find(p => p !== user?.uid);
        const otherUserDetails = otherUserId ? conv.participantDetails[otherUserId] : null;
        const isArchived = conv.archived?.[user?.uid || ''] || false;
        return {
          id: conv.id,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageTimestamp,
          unreadCount: user?.uid ? (conv.unreadCount?.[user.uid] || 0) : 0,
          otherUserId: otherUserId,
          isArchived: isArchived,
          otherUser: otherUserDetails ? {
            displayName: otherUserDetails.displayName,
            avatarUrl: otherUserDetails.avatarUrl || undefined,
          } : null,
        };
      });

  return (
    <>
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h1 className="text-lg font-bold">MyChatNow</h1>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Language:</span>
          <Select value={userLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu className="px-2 space-y-1">
            <SidebarMenuItem>
              <Button asChild size="lg" className="w-full justify-start bg-background text-[#FFF5EE] border border-border hover:bg-[#003366] hover:text-[#FFF5EE]">
                  <Link href="/friends">
                      <Users className="h-4 w-4 mr-2" /> Friends & Requests
                  </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button asChild size="lg" className="w-full justify-start bg-background text-[#FFF5EE] border border-border hover:bg-[#005B99] hover:text-[#FFF5EE]">
                  <Link href="/profile">
                      <UserIcon className="h-4 w-4 mr-2" /> Your Profile
                  </Link>
              </Button>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <QuickPhrasesPanel />
            </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSeparator />
        
        {/* Tabs for Chats / Archived */}
        <div className="p-2 flex gap-2">
          <Button
            variant={currentTab === 'chats' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setCurrentTab('chats')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button
            variant={currentTab === 'archived' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setCurrentTab('archived')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
        </div>

        <SidebarMenu className="px-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : allChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {currentTab === 'archived' ? 'No archived chats' : 'No chats yet. Add a friend to start chatting!'}
            </div>
          ) : (
            allChats.map(chat => {
              if (!chat.otherUser) return null;
              const isHovered = hoveredChat === chat.id;
              return (
                <SidebarMenuItem 
                  key={chat.id} 
                  onClick={() => onChatSelect(chat.id)}
                  onMouseEnter={() => setHoveredChat(chat.id)}
                  onMouseLeave={() => setHoveredChat(null)}
                  className="relative group"
                >
                  <SidebarMenuButton
                    isActive={selectedChatId === chat.id}
                    className="h-auto p-2 justify-start hover:bg-sidebar-accent"
                  >
                    <Avatar 
                      className="h-8 w-8 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chat.otherUserId) handleAvatarClick(chat.otherUserId);
                      }}
                    >
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
                      {chat.unreadCount > 0 && (
                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4500] text-[#FFF5EE] text-[10px] font-bold">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                  
                  {/* Archive and Delete buttons - appear on hover */}
                  {isHovered && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-sidebar-accent rounded-md p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleArchiveConversation(chat.id, e)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConversationToDelete(chat.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
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

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          user={selectedUser}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
