'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getLinguaSystemPrompt } from '@/lib/ai-friend';

const AIChatInputSchema = z.object({
  userMessage: z.string(),
  userLanguage: z.enum(['en', 'es']),
});

export type AIChatInput = z.infer<typeof AIChatInputSchema>;

export async function chatWithLingua(input: AIChatInput): Promise<{ response: string }> {
  const systemPrompt = getLinguaSystemPrompt(input.userLanguage);
  const prompt = `${systemPrompt}\n\nUser: ${input.userMessage}`;
  
  const result = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    prompt,
    config: { temperature: 0.9, maxOutputTokens: 150 },
  });

  return { response: result.text };
}
