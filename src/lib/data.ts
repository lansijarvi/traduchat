import type { User, Chat } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const loggedInUser: User = {
  id: 'user1',
  name: 'Alex',
  avatarUrl: getImage('alex-avatar'),
  username: 'alex',
};

export const users: User[] = [
  loggedInUser,
  { id: 'user2', name: 'Mia', avatarUrl: getImage('mia-avatar'), username: 'mia' },
  { id: 'user3', name: 'Carlos', avatarUrl: getImage('carlos-avatar'), username: 'carlos' },
  { id: 'user4', name: 'Sofia', avatarUrl: getImage('sofia-avatar'), username: 'sofia' },
];

export const chats: Chat[] = [
  {
    id: '1',
    participants: [users[0], users[1]],
    messages: [
      { id: 'msg1', text: 'Hey Mia, how are you?', senderId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 5), lang: 'en' },
      { id: 'msg2', text: 'Hola Alex! Estoy bien, y tu?', senderId: 'user2', timestamp: new Date(Date.now() - 1000 * 60 * 4), lang: 'es' },
      { id: 'msg3', text: 'I am good, thanks! Did you see the new movie?', senderId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 3), lang: 'en' },
      { id: 'msg4', text: 'No, todavía no la he visto. ¿Es buena?', senderId: 'user2', timestamp: new Date(Date.now() - 1000 * 60 * 2), lang: 'es', translatedText: 'No, I have not seen it yet. Is it good?'},
    ],
    lastMessage: 'No, todavía no la he visto. ¿Es buena?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 2),
    unreadCount: 0,
  },
  {
    id: '2',
    participants: [users[0], users[2]],
    messages: [
      { id: 'msg5', text: 'Hi Carlos, are you free for a call tomorrow?', senderId: 'user1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), lang: 'en' },
      { id: 'msg6', text: 'Sí, por la tarde estoy libre. ¿A qué hora?', senderId: 'user3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), lang: 'es' },
    ],
    lastMessage: 'Sí, por la tarde estoy libre. ¿A qué hora?',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
    unreadCount: 1,
  },
  {
    id: '3',
    participants: [users[0], users[3]],
    messages: [],
    lastMessage: 'Say hi!',
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    unreadCount: 0,
  },
];
