export type User = {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
};

export type Message = {
    id: string;
    text: string;
    translatedText?: string;
    senderId: string;
    timestamp: Date;
    lang: 'en' | 'es';
};

export type Chat = {
    id: string;
    participants: User[];
    messages: Message[];
    lastMessage: string;
    lastMessageTimestamp: Date;
    unreadCount: number;
};
