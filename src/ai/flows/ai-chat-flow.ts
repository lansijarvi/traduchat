'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getLinguaSystemPrompt } from '@/lib/ai-friend';
import { googleAI } from '@genkit-ai/google-genai';

const AIChatInputSchema = z.object({
  userMessage: z.string(),
  userLanguage: z.enum(['en', 'es']),
});

export type AIChatInput = z.infer<typeof AIChatInputSchema>;

export async function chatWithLingua(input: AIChatInput): Promise<{ response: string }> {
  const systemPrompt = getLinguaSystemPrompt(input.userLanguage);
  
  const result = await ai.generate({
    model: googleAI.model('gemini-2.5-flash'),
    system: systemPrompt,
    prompt: input.userMessage,
    config: { temperature: 0.9, maxOutputTokens: 150 },
  });

  return { response: result.text };
}
