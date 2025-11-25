"use client"
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Mic, Send, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from '@/lib/conversation-helpers';
import { uploadFile, validateFile, type Attachment } from '@/lib/upload-helpers';
import { extractUrls, fetchLinkPreview, type LinkPreview } from '@/lib/link-preview-helpers';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface MessageInputProps {
  chatId?: string | null;
  onMessageSent?: (userMsg: string) => void;
}

export function MessageInput({ chatId, onMessageSent }: MessageInputProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: validation.error,
        });
        continue;
      }

      try {
        const attachment = await uploadFile(file, user.uid);
        newAttachments.push(attachment);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: error.message,
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    const messageText = input.value.trim();
    
    if (!messageText && attachments.length === 0) return;
    if (!chatId) return;
    if (!db || !user) return;
      
      setIsSending(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userLanguage = userDoc.exists() ? (userDoc.data().language || 'en') : 'en';
        
        // Extract URLs and fetch preview for first URL
        let linkPreview: LinkPreview | undefined;
        if (messageText) {
          const urls = extractUrls(messageText);
          if (urls.length > 0) {
            const preview = await fetchLinkPreview(urls[0]);
            if (preview) linkPreview = preview;
          }
        }

        // Save message with attachments and link preview
        const messagesRef = collection(db, 'conversations', chatId, 'messages');
        await addDoc(messagesRef, {
          text: messageText,
          senderId: user.uid,
          senderLanguage: userLanguage,
          timestamp: serverTimestamp(),
          read: false,
          ...(attachments.length > 0 && { attachments }),
          ...(linkPreview && { linkPreview }),
        });

        // Update conversation
        const conversationRef = doc(db, 'conversations', chatId);
        await setDoc(conversationRef, {
          lastMessage: messageText || '📎 Attachment',
          lastMessageTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        input.value = "";
        setAttachments([]);
        
        if (onMessageSent) {
          onMessageSent(messageText);
        }
        
        toast({
          title: "Message sent!",
        });
      } catch (error: any) {
        console.error('Send error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not send message.",
        });
      } finally {
        setIsSending(false);
      }
  };

  return (
    <div className="border-t shrink-0 bg-background">
      {attachments.length > 0 && (
        <div className="p-2 border-b flex gap-2 overflow-x-auto">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative flex-shrink-0">
              {attachment.type === 'image' ? (
                <img src={attachment.url} alt={attachment.name} className="h-20 w-20 object-cover rounded" />
              ) : (
                <div className="h-20 w-20 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isUploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input 
          name="message" 
          placeholder={isUploading ? "Uploading..." : isSending ? "Sending..." : "Type a message..."} 
          className="flex-1 bg-input" 
          autoComplete="off"
          disabled={isSending || isUploading}
        />
        <Button type="button" variant="ghost" size="icon" disabled={isSending || isUploading}>
          <Mic className="h-5 w-5" />
        </Button>
        <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90" disabled={isSending || isUploading}>
          <Send className="h-5 w-5 text-accent-foreground" />
        </Button>
      </form>
    </div>
  );
}
