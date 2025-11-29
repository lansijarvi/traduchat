"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Languages, ExternalLink, Download, File, Trash2 } from "lucide-react";
import type { MediaAttachment, LinkPreview } from "@/lib/conversation-helpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserProfileModal } from "@/components/user-profile-modal";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface Message {
  id: string;
  senderId: string;
  content: string;
  originalContent?: string;
  wasTranslated?: boolean;
  detectedLanguage?: string;
  senderLanguage?: string;
  receiverLanguage?: string;
  englishVersion?: string;
  spanishVersion?: string;
  translatedContent?: string;
  timestamp: Date;
  senderName?: string;
  senderAvatar?: string;
  media?: MediaAttachment[];
  linkPreview?: LinkPreview;
}

interface ChatMessageListProps {
  onDeleteMessage?: (messageId: string) => void;
  messages: Message[];
  currentUserLanguage?: string;
  currentUserId: string;
}

export function ChatMessageList({ messages, currentUserId, currentUserLanguage, onDeleteMessage }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showingTranslated, setShowingTranslated] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const db = useFirestore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAvatarClick = async (userId: string) => {
    if (!db) return;
    console.log("Avatar clicked for user:", userId);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUser({
          uid: userId,
          displayName: userData.displayName || 'Unknown User',
          username: userData.username,
          bio: userData.bio,
          avatarUrl: userData.avatarUrl,
          country: userData.country,
          language: userData.language,
          createdAt: userData.createdAt?.toDate(),
          gallery: userData.gallery || { photos: [], videos: [] },
        });
        setProfileModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth"
        style={{ overflowAnchor: 'auto' }}
      >
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            const isShowingTranslated = showingTranslated === message.id;
            
            let displayContent = message.content;
            let isShowingAlternate = false;
            let hasTranslation = false;
            
            // Smart Learning mode: Use englishVersion/spanishVersion
            if (message.englishVersion && message.spanishVersion) {
              const userLang = currentUserLanguage || 'en';
              
              if (userLang === 'en') {
                // English user: show English by default, hover shows Spanish
                displayContent = isShowingTranslated ? message.spanishVersion : message.englishVersion;
              } else {
                // Spanish user: show Spanish by default, hover shows English
                displayContent = isShowingTranslated ? message.englishVersion : message.spanishVersion;
              }
              isShowingAlternate = isShowingTranslated;
              hasTranslation = true;
            }
            // Legacy Profile-Based mode
            else if (!isOwn && message.wasTranslated) {
              displayContent = isShowingTranslated ? message.originalContent! : message.content;
              isShowingAlternate = isShowingTranslated;
              hasTranslation = true;
            } else if (isOwn && message.translatedContent) {
              displayContent = isShowingTranslated ? message.translatedContent : message.content;
              isShowingAlternate = isShowingTranslated;
              hasTranslation = true;
            } else {
              hasTranslation = false;
            }

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && (
                  <Avatar 
                    className="h-8 w-8 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleAvatarClick(message.senderId)}
                  >
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback>
                      {message.senderName?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "flex flex-col max-w-[70%]",
                    isOwn ? "items-end" : "items-start"
                  )}
                >
                  {!isOwn && message.senderName && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {message.senderName}
                    </span>
                  )}
                  
                  <div className="space-y-2">
                    {message.media && message.media.length > 0 && (
                      <div className={cn(
                        "grid gap-2",
                        message.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      )}>
                        {message.media.map((media, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden">
                            {media.type === 'image' && (
                              <img 
                                src={media.url} 
                                alt={media.name}
                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setFullscreenMedia(media.url)}
                              />
                            )}
                            {media.type === 'video' && (
                              <div className="relative bg-black rounded-lg">
                                <video 
                                  src={media.url} 
                                  controls
                                  className="max-w-full h-auto rounded-lg"
                                >
                                  Your browser does not support video playback.
                                </video>
                              </div>
                            )}
                            {media.type === 'file' && (
                              <a 
                                href={media.url}
                                download={media.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                  isOwn 
                                    ? "bg-primary/10 border-primary/20 hover:bg-primary/20" 
                                    : "bg-muted hover:bg-muted/80"
                                )}
                              >
                                <File className="h-8 w-8 text-cyan shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{media.name}</p>
                                  {media.size && (
                                    <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                                  )}
                                </div>
                                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.linkPreview && (
                      <a
                        href={message.linkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "block border rounded-lg overflow-hidden transition-colors",
                          isOwn 
                            ? "bg-primary/10 border-primary/20 hover:bg-primary/20" 
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {message.linkPreview.image && (
                          <img 
                            src={message.linkPreview.image} 
                            alt=""
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold line-clamp-1">{message.linkPreview.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {message.linkPreview.description}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-cyan">
                            <ExternalLink className="h-3 w-3" />
                            <p className="text-xs truncate">
                              {new URL(message.linkPreview.url).hostname}
                            </p>
                          </div>
                        </div>
                      </a>
                    )}

                    {displayContent && (
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 relative group",
                          isOwn
                            ? "bg-message-sender text-[#001F3F]"
                            : "bg-muted"
                        )}
                        onMouseEnter={() => hasTranslation && setShowingTranslated(message.id)}
                        onMouseLeave={() => setShowingTranslated(null)}
                        onClick={() => {
                          if (hasTranslation) {
                            setShowingTranslated(prev => prev === message.id ? null : message.id);
                          }
                        }}
                      >
                        {hasTranslation && (
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-cyan text-background rounded-full p-1">
                              <Languages className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">
                        {isOwn && onDeleteMessage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMessageToDelete(message.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                          {displayContent}
                        </p>
                        {hasTranslation && (
                          <div className="text-xs opacity-70 mt-1 italic">
                            {isOwn ? (
                              isShowingAlternate ? "Translated" : "Original"
                            ) : (
                              isShowingAlternate ? "Original" : "Translated"
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground mt-1">
                    {format(message.timestamp, "HH:mm")}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {fullscreenMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreenMedia(null)}
        >
          <img 
            src={fullscreenMedia} 
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (messageToDelete && onDeleteMessage) {
                  onDeleteMessage(messageToDelete);
                  setMessageToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          user={selectedUser}
        />
      )}

    </>
  );
}
