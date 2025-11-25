"use client"
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  useSidebar
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      // In mobile, selecting a chat should feel like opening a new screen.
      // We can achieve this by managing a state here or using the sidebar's mobile behavior.
    }
  };

  const handleBack = () => {
    setSelectedChatId(null);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={cn(
          "flex h-screen w-full",
          isMobile && "overflow-hidden"
      )}>
        <Sidebar className={cn(
            "border-r border-sidebar-border transition-transform duration-300",
            isMobile && selectedChatId ? "-translate-x-full" : "translate-x-0"
        )}>
          <ChatSidebar onChatSelect={handleChatSelect} selectedChatId={selectedChatId} />
        </Sidebar>

        <SidebarInset className={cn(
          "flex-1 p-0 m-0 transition-transform duration-300",
          isMobile && !selectedChatId ? "hidden" : "block",
          isMobile && selectedChatId ? "absolute inset-0 translate-x-0" : "",
          isMobile && !selectedChatId ? "translate-x-full" : ""
        )}>
           <ChatArea chatId={selectedChatId} onBack={isMobile ? handleBack : undefined} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
