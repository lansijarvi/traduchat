"use client"
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>("1");

  return (
    <SidebarProvider>
      <div className="flex h-full">
        <Sidebar>
          <ChatSidebar onChatSelect={setSelectedChatId} selectedChatId={selectedChatId} />
        </Sidebar>
        <SidebarInset className="p-0 m-0 rounded-none shadow-none md:m-0 md:rounded-none">
          <ChatArea chatId={selectedChatId} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
