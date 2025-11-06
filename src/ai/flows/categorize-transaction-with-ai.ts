'use server';

/**
 * @fileOverview An AI agent that suggests a transaction category based on transaction details.
 *
 * - suggestCategory - A function that suggests a category for a transaction.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('The description of the transaction.'),
  amount: z.number().describe('The amount of the transaction.'),
  accountType: z.string().describe('The type of the account used for the transaction.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the transaction.'),
  confidence: z.number().describe('The confidence level of the suggested category (0-1).'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are a personal finance expert. Your task is to suggest a category for a given transaction based on its details.

Transaction Description: {{{description}}}
Transaction Amount: {{{amount}}}
Account Type: {{{accountType}}}

Consider common transaction categories such as Groceries, Dining, Entertainment, Utilities, Transportation, Healthcare, Shopping, Income, etc.

Provide the most appropriate category and a confidence level (0-1) indicating how sure you are about the suggestion.
`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
