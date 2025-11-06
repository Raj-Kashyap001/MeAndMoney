'use server';

/**
 * @fileOverview Provides personalized financial tips based on user spending patterns.
 *
 * - getFinancialTips - A function that analyzes spending and provides tips.
 * - FinancialTipsInput - The input type for the getFinancialTips function.
 * - FinancialTipsOutput - The return type for the getFinancialTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialTipsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A JSON string containing the user spending data, including categories and amounts.'
    ),
  income: z.number().describe('The user monthly income.'),
});
export type FinancialTipsInput = z.infer<typeof FinancialTipsInputSchema>;

const FinancialTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe('An array of personalized financial tips for the user.'),
});
export type FinancialTipsOutput = z.infer<typeof FinancialTipsOutputSchema>;

export async function getFinancialTips(
  input: FinancialTipsInput
): Promise<FinancialTipsOutput> {
  return financialTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTipsPrompt',
  input: {schema: FinancialTipsInputSchema},
  output: {schema: FinancialTipsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's spending patterns and provide personalized tips to save money.

Spending Data: {{{spendingData}}}

Monthly Income: {{{income}}}

Provide a list of actionable tips to help the user reduce spending and improve their financial health. Focus on specific spending categories.

Format the output as a JSON array of strings.`, //Crucially, you MUST NOT attempt to directly call functions, use await keywords, or perform any complex logic _within_ the Handlebars template string.
});

const financialTipsFlow = ai.defineFlow(
  {
    name: 'financialTipsFlow',
    inputSchema: FinancialTipsInputSchema,
    outputSchema: FinancialTipsOutputSchema,
  },
  async input => {
    try {
      JSON.parse(input.spendingData);
    } catch (e) {
      throw new Error('Invalid JSON provided in spendingData: ' + e);
    }

    const {output} = await prompt(input);
    return output!;
  }
);
