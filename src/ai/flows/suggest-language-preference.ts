'use server';

/**
 * @fileOverview Suggests the user's preferred language based on chat history and given options.
 *
 * - suggestLanguagePreference - A function that suggests the user's preferred language.
 * - SuggestLanguagePreferenceInput - The input type for the suggestLanguagePreference function.
 * - SuggestLanguagePreferenceOutput - The return type for the suggestLanguagePreference function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLanguagePreferenceInputSchema = z.object({
  chatHistory: z.string().describe('The chat history between the user and others.'),
  languageOptions: z.array(z.string()).describe('A list of available language options for the user.'),
});
export type SuggestLanguagePreferenceInput = z.infer<typeof SuggestLanguagePreferenceInputSchema>;

const SuggestLanguagePreferenceOutputSchema = z.object({
  suggestedLanguage: z.string().describe('The AI suggested language based on the chat history.'),
});
export type SuggestLanguagePreferenceOutput = z.infer<typeof SuggestLanguagePreferenceOutputSchema>;

export async function suggestLanguagePreference(input: SuggestLanguagePreferenceInput): Promise<SuggestLanguagePreferenceOutput> {
  return suggestLanguagePreferenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLanguagePreferencePrompt',
  input: {schema: SuggestLanguagePreferenceInputSchema},
  output: {schema: SuggestLanguagePreferenceOutputSchema},
  prompt: `Given the following chat history and language options, suggest the most appropriate language for the user. Return the language only.\n\nChat History: {{{chatHistory}}}\n\nLanguage Options: {{{languageOptions}}}`,
});

const suggestLanguagePreferenceFlow = ai.defineFlow(
  {
    name: 'suggestLanguagePreferenceFlow',
    inputSchema: SuggestLanguagePreferenceInputSchema,
    outputSchema: SuggestLanguagePreferenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
