"use client"
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Paperclip, 
  Send,
  Smile,
  X,
  Image as ImageIcon,
  Video,
  File,
  Loader2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { MediaAttachment, LinkPreview } from '@/lib/conversation-helpers';

interface ChatInputProps {
  onSendMessage: (message: string, media?: MediaAttachment[], linkPreview?: LinkPreview) => void;
}

const emojis = ['😂', '❤️', '👍', '😊', '🎉', '🔥', '✨', '💯', '🎯', '⚡'];

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();
  const { toast } = useToast();

  // Detect URLs in message and fetch preview
  React.useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);
    
    if (urls && urls.length > 0 && !linkPreview && !loadingPreview) {
      fetchLinkPreview(urls[0]);
    } else if (!urls || urls.length === 0) {
      setLinkPreview(null);
    }
  }, [message]);

  const fetchLinkPreview = async (url: string) => {
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/url-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      if (response.ok) {
        const preview = await response.json();
        setLinkPreview(preview);
      }
    } catch (error) {
      console.error('Failed to fetch link preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, attachments.length > 0 ? attachments : undefined, linkPreview || undefined);
      setMessage('');
      setAttachments([]);
      setLinkPreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage) return;

    setUploading(true);
    const newAttachments: MediaAttachment[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: `${file.name} is over 25MB`,
          });
          continue;
        }

        // Determine file type
        let type: 'image' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        // Upload to Firebase Storage
        const storageRef = ref(storage, `chat-media/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        newAttachments.push({
          type,
          url,
          name: file.name,
          size: file.size,
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      toast({
        title: 'Files uploaded!',
        description: `${newAttachments.length} file(s) ready to send`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeLinkPreview = () => {
    setLinkPreview(null);
  };

  return (
    <div className="p-2 border-t border-border bg-card">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type === 'image' && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {attachment.type === 'video' && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {attachment.type === 'file' && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link Preview */}
      {linkPreview && (
        <div className="mb-2 border border-border rounded-lg p-2 flex gap-2 bg-muted/50 relative group">
          {linkPreview.image && (
            <img src={linkPreview.image} alt="" className="w-16 h-16 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{linkPreview.title}</p>
            <p className="text-xs text-muted-foreground truncate">{linkPreview.description}</p>
            <p className="text-xs text-cyan truncate">{new URL(linkPreview.url).hostname}</p>
          </div>
          <button
            onClick={removeLinkPreview}
            className="absolute top-1 right-1 bg-background border border-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Attach file"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[36px] max-h-32 py-2 px-3 pr-10 text-sm resize-none"
            rows={1}
          />
          <div className="absolute right-1 bottom-1 flex items-center">
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Add emoji">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 border-none shadow-lg bg-background/80 backdrop-blur-sm">
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="icon"
                      className="text-xl rounded-full h-9 w-9"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button 
          onClick={handleSend} 
          size="icon" 
          className="h-8 w-8 shrink-0 bg-cyan hover:bg-cyan/90"
          disabled={!message.trim() && attachments.length === 0}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
