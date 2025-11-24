"use client";
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { searchUsers, sendFriendRequest, type UserProfile } from '@/lib/firestore-helpers';
import { useToast } from '@/hooks/use-toast';

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!db || !searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const users = await searchUsers(db, searchQuery);
      // Filter out current user
      setResults(users.filter(u => u.uid !== user?.uid));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (toUserId: string) => {
    if (!db || !user) return;
    
    try {
      await sendFriendRequest(db, user.uid, toUserId);
      toast({
        title: 'Friend request sent!',
        description: 'Wait for them to accept.',
      });
      // Remove from results
      setResults(results.filter(r => r.uid !== toUserId));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((profile) => (
          <div key={profile.uid} className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">@{profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.displayName}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => handleAddFriend(profile.uid)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        ))}
        {results.length === 0 && searchQuery && !loading && (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
