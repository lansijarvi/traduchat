import ChatLayout from "@/components/chat/chat-layout";
import { redirect } from 'next/navigation';

export default function Home() {
  // In a real app, you would get the user session. We mock it here for demonstration.
  const isLoggedIn = true; 
  
  if (!isLoggedIn) {
    redirect('/login');
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <ChatLayout />
    </main>
  );
}
