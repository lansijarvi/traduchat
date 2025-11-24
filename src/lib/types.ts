export type User = {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
};

export type Attachment = {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
    size: number;
};

export type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
};

export type Message = {
    id: string;
    text: string;
    translatedText?: string;
    senderId: string;
    timestamp: Date;
    lang: 'en' | 'es';
    attachments?: Attachment[];
    linkPreview?: LinkPreview;
};

export type Chat = {
    id: string;
    participants: User[];
    messages: Message[];
    lastMessage: string;
    lastMessageTimestamp: Date;
    unreadCount: number;
};
