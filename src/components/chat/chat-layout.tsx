"use client"
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatLayoutProps {
  initialChatId?: string | null;
}

export default function ChatLayout({ initialChatId }: ChatLayoutProps) {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(initialChatId || null);
  const isMobile = useIsMobile();

  // Update selected chat when initialChatId changes
  React.useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
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
