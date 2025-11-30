"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Languages, Globe, Image as ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES: { [key: string]: string } = {
  "US": "🇺🇸", "MX": "🇲🇽", "ES": "🇪🇸", "AR": "🇦🇷", "CO": "🇨🇴",
  "CL": "🇨🇱", "PE": "🇵🇪", "VE": "🇻🇪", "EC": "🇪🇨", "GT": "🇬🇹",
  "CU": "🇨��", "BO": "🇧🇴", "DO": "🇩🇴", "HN": "🇭🇳", "PY": "🇵🇾",
  "SV": "🇸🇻", "NI": "🇳🇮", "CR": "🇨��", "PA": "🇵🇦", "UY": "🇺🇾",
  "GB": "🇬🇧", "CA": "🇨🇦", "FR": "🇫🇷", "DE": "🇩🇪", "IT": "🇮��",
  "PT": "🇵🇹", "BR": "🇧🇷", "JP": "🇯🇵", "CN": "🇨🇳", "IN": "🇮🇳",
  "KR": "🇰🇷", "AU": "��🇺", "NZ": "🇳🇿"
};

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    uid: string;
    displayName: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    country?: string;
    language?: 'en' | 'es';
    createdAt?: Date;
    gallery?: {
      photos?: string[];
      videos?: string[];
    };
  };
}

export function UserProfileModal({ open, onOpenChange, user }: UserProfileModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const isOwnProfile = currentUser?.uid === user.uid;

  const handleFileUpload = async (files: FileList | null, type: 'photos' | 'videos') => {
    if (!files || files.length === 0 || !db || !storage || !currentUser) return;
    
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `${currentUser.uid}/gallery/${type}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      });

      const uploadedURLs = await Promise.all(uploadPromises);

      // Update Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`gallery.${type}`]: arrayUnion(...uploadedURLs)
      });

      toast({
        title: "Upload successful!",
        description: `${uploadedURLs.length} ${type} uploaded successfully.`,
      });

      // Refresh the user data
      user.gallery = user.gallery || { photos: [], videos: [] };
      if (type === 'photos') {
        user.gallery.photos = [...(user.gallery.photos || []), ...uploadedURLs];
      } else {
        user.gallery.videos = [...(user.gallery.videos || []), ...uploadedURLs];
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const languageNames = {
    'en': 'English',
    'es': 'Español'
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              View user profile and media
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="space-y-6 pr-4">
              {/* Header Section */}
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-2xl">
                    {user.displayName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-2xl font-bold">{user.displayName}</h2>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {user.language && (
                    <Badge variant="outline" className="gap-1">
                      <Languages className="h-3 w-3" />
                      {languageNames[user.language]}
                    </Badge>
                  )}
                  {user.country && (
                    <Badge variant="outline" className="gap-1">
                      {COUNTRIES[user.country] || "🌍"} {user.country}
                    </Badge>
                  )}
                  {user.createdAt && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {format(user.createdAt, 'MMM yyyy')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Media Tabs */}
              <Tabs defaultValue="photos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="photos" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Photos ({user.gallery?.photos?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="gap-2">
                    <Video className="h-4 w-4" />
                    Videos ({user.gallery?.videos?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="mt-4">
                  {isOwnProfile && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'photos');
                          input.click();
                        }}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photos
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {user.gallery?.photos && user.gallery.photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {user.gallery.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedMedia(photo)}
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No photos yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  {isOwnProfile && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={uploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.multiple = true;
                          input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, 'videos');
                          input.click();
                        }}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Videos
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {user.gallery?.videos && user.gallery.videos.length > 0 ? (
                    <div className="space-y-4">
                      {user.gallery.videos.map((video, index) => (
                        <div key={index} className="rounded-lg overflow-hidden bg-black">
                          <video
                            src={video}
                            controls
                            className="w-full"
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No videos yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Media Viewer */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <img
            src={selectedMedia}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
