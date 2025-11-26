"use client"
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Phone, 
  Video, 
  Search,
  Menu,
  ArrowLeft,
  Languages
} from 'lucide-react';
import { useSidebar } from "@/components/ui/sidebar";

interface ChatHeaderProps {
  name: string;
  avatarUrl?: string;
  status?: string;
  language?: 'en' | 'es';
  onBack?: () => void;
}

export function ChatHeader({ name, avatarUrl, status, language, onBack }: ChatHeaderProps) {
  const { toggleSidebar } = useSidebar();
  
  const languageNames = {
    'en': 'English',
    'es': 'Español'
  };
  
  return (
    <div className="flex items-center justify-between p-2 border-b border-border bg-card">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {onBack ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 shrink-0" 
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 md:hidden shrink-0" 
            onClick={toggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="text-xs">{(name?.[0] || "U")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <h2 className="font-semibold text-sm truncate">{name}</h2>
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
          {language && (
            <Badge variant="outline" className="w-fit text-xs gap-1 mt-0.5">
              <Languages className="h-3 w-3" />
              {languageNames[language]}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Search className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Phone className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex">
          <Video className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
