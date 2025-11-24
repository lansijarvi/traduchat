"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";

interface ChatHeaderProps {
  conversation: any;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const { user } = useUser();
  
  // Get the other participant (not current user)
  const otherParticipant = conversation.participants?.find(
    (p: any) => p.uid !== user?.uid
  );

  return (
    <div className="border-b p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherParticipant?.avatarUrl} />
          <AvatarFallback>
            {otherParticipant?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{otherParticipant?.displayName}</h2>
          <p className="text-sm text-muted-foreground">
            @{otherParticipant?.username}
          </p>
        </div>
      </div>
    </div>
  );
}
