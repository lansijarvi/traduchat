"use client";

import ChatLayout from "@/components/chat/chat-layout";
import { redirect } from 'next/navigation';
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, loading } = useUser();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    redirect('/login');
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <ChatLayout />
    </main>
  );
}
