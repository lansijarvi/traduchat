"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { getPendingFriendRequests } from "@/lib/firestore-helpers";
import { acceptFriendRequest } from "@/lib/conversation-helpers";
import { doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, X, Check } from "lucide-react";

export function FriendRequests() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) return;
    
    getPendingFriendRequests(db, user.uid).then((reqs) => {
      setRequests(reqs);
      setLoading(false);
    });
  }, [db, user]);

  const handleAccept = async (friendshipId: string) => {
    if (!db || !user) return;
    setProcessingId(friendshipId);
    
    try {
      await acceptFriendRequest(db, friendshipId, user.uid);
      setRequests(requests.filter(r => r.id !== friendshipId));
      toast({
        title: "Friend request accepted!",
        description: "You can now chat with this user.",
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not accept request.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    if (!db) return;
    setProcessingId(friendshipId);
    
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
      setRequests(requests.filter(r => r.id !== friendshipId));
      toast({
        title: "Friend request declined",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not decline request.",
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

  if (requests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No pending friend requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.fromUser.avatarUrl} />
                <AvatarFallback>{request.fromUser.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.fromUser.displayName}</p>
                <p className="text-sm text-muted-foreground">@{request.fromUser.username}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><X className="h-4 w-4 mr-1" /> Decline</>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><Check className="h-4 w-4 mr-1" /> Accept</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
