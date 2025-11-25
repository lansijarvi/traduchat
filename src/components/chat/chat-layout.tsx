"use client"
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { AI_CONVERSATION_ID } from '@/lib/ai-friend';

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(AI_CONVERSATION_ID);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="border-r border-sidebar-border">
          <ChatSidebar onChatSelect={setSelectedChatId} selectedChatId={selectedChatId} />
        </Sidebar>
        <SidebarInset className="flex-1 p-0 m-0">
          <ChatArea chatId={selectedChatId} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
