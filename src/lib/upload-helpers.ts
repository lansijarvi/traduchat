import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorage } from 'firebase/storage';

export type AttachmentType = 'image' | 'video' | 'file';

export interface Attachment {
  type: AttachmentType;
  url: string;
  name: string;
  size: number;
}

export async function uploadFile(file: File, userId: string): Promise<Attachment> {
  const storage = getStorage();
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `attachments/${userId}/${timestamp}_${sanitizedName}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  let type: AttachmentType = 'file';
  if (file.type.startsWith('image/')) type = 'image';
  else if (file.type.startsWith('video/')) type = 'video';
  
  return {
    type,
    url,
    name: file.name,
    size: file.size,
  };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File must be less than 10MB' };
  }
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM) are allowed' };
  }
  
  return { valid: true };
}
