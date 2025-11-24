export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Use a CORS proxy or your own backend endpoint
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        url,
        title: data.data.title,
        description: data.data.description,
        image: data.data.image?.url,
        siteName: data.data.publisher,
      };
    }
  } catch (error) {
    console.error('Link preview error:', error);
  }
  
  return null;
}
