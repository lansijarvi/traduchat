"use client";

import { useRouter } from 'next/navigation';
import { useUser } from "@/firebase";
import { useEffect } from "react";
import dynamic from 'next/dynamic';

const ChatLayout = dynamic(() => import("@/components/chat/chat-layout"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
});

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return <ChatLayout />;
}
