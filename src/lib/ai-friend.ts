import type { User } from '@/lib/types';

export const AI_FRIEND_ID = 'ai_lingua';
export const AI_CONVERSATION_ID = 'ai_chat';

export const linguaAI: User = {
  id: AI_FRIEND_ID,
  name: 'Lingua',
  username: 'lingua_ai',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=lingua&backgroundColor=b6e3f4',
};

export function getLinguaSystemPrompt(userLanguage: 'en' | 'es'): string {
  const respondInLanguage = userLanguage === 'en' ? 'Spanish' : 'English';
  return `You are Lingua, a friendly language tutor. Respond in ${respondInLanguage}. Be warm and conversational. Keep responses SHORT (2-3 sentences). Gently correct mistakes. Ask follow-up questions. Use emojis occasionally 😊`;
}
