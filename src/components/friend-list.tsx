"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { getFriends, deleteFriend, type UserProfile } from "@/lib/firestore-helpers";
import { createConversation } from "@/lib/conversation-helpers";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function FriendList() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) return;
    
    getFriends(db, user.uid).then((friendList) => {
      setFriends(friendList);
      setLoading(false);
    });
  }, [db, user]);

  const handleMessage = async (friend: UserProfile) => {
    if (!db || !user) return;
    
    setProcessingId(friend.uid);
    
    try {
      // Get current user details
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (!currentUserDoc.exists()) {
        throw new Error('User profile not found');
      }
      const currentUserData = currentUserDoc.data();
      
      // Create or get conversation
      const conversationId = await createConversation(
        db,
        user.uid,
        friend.uid,
        {
          username: currentUserData.username || '',
          displayName: currentUserData.displayName || user.displayName || '',
          avatarUrl: currentUserData.avatarUrl || user.photoURL || '',
          language: currentUserData.language || 'en',
        },
        {
          username: friend.username || '',
          displayName: friend.displayName || '',
          avatarUrl: friend.avatarUrl || '',
          language: friend.language || 'en',
        }
      );
      
      // Navigate to home with conversation ID in URL
      router.push(`/?chat=${conversationId}`);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not start conversation.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (friendId: string) => {
    if (!db || !user) return;
    setProcessingId(friendId);
    
    try {
      await deleteFriend(db, user.uid, friendId);
      setFriends(friends.filter(f => f.uid !== friendId));
      toast({
        title: "Friend removed",
        description: "They are no longer in your friends list.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not remove friend.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        You have no friends yet. Use the search tab to find some!
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {friends.map((friend) => (
        <Card key={friend.uid}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={friend.avatarUrl} />
                <AvatarFallback>{(friend?.username?.[0]?.toUpperCase() || "U")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{friend.displayName}</p>
                <p className="text-sm text-muted-foreground">@{friend.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMessage(friend)}
                disabled={processingId === friend.uid}
              >
                {processingId === friend.uid ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><MessageSquare className="h-4 w-4 mr-1" /> Message</>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button
                    size="sm"
                    variant="destructive"
                    disabled={processingId === friend.uid}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your friendship and conversation history with {friend.displayName}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(friend.uid)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
