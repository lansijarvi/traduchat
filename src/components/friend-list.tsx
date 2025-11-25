"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { getFriends, deleteFriend, type UserProfile } from "@/lib/firestore-helpers";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

  const handleMessage = (friendId: string) => {
    const conversationId = [user?.uid, friendId].sort().join('_');
    // In a real app, you'd navigate to the chat, maybe passing the conversationId
    // For now, we'll just log it and redirect home, where the chat layout can open it.
    console.log("Starting chat with conversationId:", conversationId);
    router.push('/');
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
                onClick={() => handleMessage(friend.uid)}
                disabled={processingId === friend.uid}
              >
                <MessageSquare className="h-4 w-4 mr-1" /> Message
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button
                    size="sm"
                    variant="destructive"
                    disabled={processingId === friend.uid}
                  >
                    {processingId === friend.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Trash2 className="h-4 w-4 mr-1" /> Delete</>
                    )}
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
