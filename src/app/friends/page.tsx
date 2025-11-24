"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearch } from '@/components/user-search';
import { FriendRequests } from '@/components/friend-requests';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';

export default function FriendsPage() {
  const { user, loading } = useUser();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Friends & Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">Search Users</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search">
                <UserSearch />
              </TabsContent>
              
              <TabsContent value="requests">
                <FriendRequests />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
