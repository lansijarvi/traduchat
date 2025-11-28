"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { searchUsersByUsername as searchUsers, sendFriendRequest, type UserProfile } from '@/lib/firestore-helpers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-search as user types (debounced)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      if (!db) return;
      
      try {
        const users = await searchUsers(db, searchQuery);
        const filtered = users.filter(u => u.uid !== user?.uid);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, db, user?.uid]);

  const handleSearch = async () => {
    if (!db || !searchQuery.trim()) return;
    
    setLoading(true);
    setShowSuggestions(false);
    try {
      const users = await searchUsers(db, searchQuery);
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

  const handleSelectSuggestion = (profile: UserProfile) => {
    setSearchQuery(profile.username);
    setShowSuggestions(false);
    setResults([profile]);
  };

  const handleAddFriend = async (toUserId: string) => {
    if (!db || !user) return;
    
    try {
      await sendFriendRequest(db, user.uid, toUserId);
      toast({
        title: 'Friend request sent!',
        description: 'Wait for them to accept.',
      });
      setResults(results.filter(r => r.uid !== toUserId));
      setSuggestions(suggestions.filter(s => s.uid !== toUserId));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pr-8"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
            {suggestions.map((profile) => (
              <button
                key={profile.uid}
                onClick={() => handleSelectSuggestion(profile)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-cyan text-background">
                    {(profile?.username?.[0]?.toUpperCase() || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">@{profile.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.displayName}</p>
                </div>
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-2">
        {results.map((profile) => (
          <div key={profile.uid} className="flex items-center justify-between p-3 rounded-lg bg-card border">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="bg-cyan text-background">
                  {(profile?.username?.[0]?.toUpperCase() || "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">@{profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.displayName}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => handleAddFriend(profile.uid)} className="bg-cyan hover:bg-cyan/90">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        ))}
        {results.length === 0 && searchQuery && !loading && !showSuggestions && (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
