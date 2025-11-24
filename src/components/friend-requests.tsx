"use client";
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { getPendingRequests, acceptFriendRequest, type Friendship } from '@/lib/firestore-helpers';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

export function FriendRequests() {
  const [requests, setRequests] = useState<Array<Friendship & { senderInfo?: any }>>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !user) return;
    
    const loadRequests = async () => {
      try {
        const pending = await getPendingRequests(db, user.uid);
        
        // Fetch sender info for each request
        const requestsWithInfo = await Promise.all(
          pending.map(async (req) => {
            const senderDoc = await getDoc(doc(db, 'users', req.requestedBy));
            return {
              ...req,
              senderInfo: senderDoc.exists() ? senderDoc.data() : null,
            };
          })
        );
        
        setRequests(requestsWithInfo);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error loading requests',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadRequests();
  }, [db, user, toast]);

  const handleAccept = async (friendshipId: string) => {
    if (!db) return;
    
    try {
      await acceptFriendRequest(db, friendshipId);
      setRequests(requests.filter(r => r.id !== friendshipId));
      toast({
        title: 'Friend request accepted!',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  if (requests.length === 0) return <div className="p-4 text-center text-muted-foreground">No pending requests</div>;

  return (
    <div className="p-4 space-y-2">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={request.senderInfo?.avatarUrl} />
              <AvatarFallback>{request.senderInfo?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">@{request.senderInfo?.username}</p>
              <p className="text-sm text-muted-foreground">wants to be friends</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAccept(request.id)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
