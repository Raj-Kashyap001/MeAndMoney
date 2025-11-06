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
  starredTips: z.array(z.string()).optional().describe('An array of previously starred tips to avoid generating duplicates.'),
});
export type FinancialTipsInput = z.infer<typeof FinancialTipsInputSchema>;

const TipActionSchema = z.object({
    type: z.enum(['navigate', 'open_dialog']),
    payload: z.string().describe('The URL for navigation, or dialog to open (e.g., "add_budget", "add_goal"). For navigation, it could be a path like "/dashboard/budgets".'),
}).optional();


const TipSchema = z.object({
  tip: z.string().describe('A personalized financial tip for the user.'),
  action: TipActionSchema.describe('An optional action the user can take related to the tip.'),
});

const FinancialTipsOutputSchema = z.object({
  tips: z
    .array(TipSchema)
    .describe('An array of personalized financial tips for the user.'),
  message: z.string().optional().describe('A general message if no specific tips are generated.'),
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

{{#if starredTips}}
The user has already starred these tips, so do not generate tips that are substantially similar to these:
{{#each starredTips}}
- "{{this}}"
{{/each}}
{{/if}}

Provide a list of actionable tips to help the user reduce spending and improve their financial health. Focus on specific spending categories.
For each tip, suggest a corresponding action if applicable.
Actions can be:
- Navigating to a relevant page (e.g., '/dashboard/budgets', '/dashboard/transactions?category=Shopping').
- Suggesting to open a dialog (e.g., 'add_goal', 'add_budget').

Example actions:
- A tip about reviewing a budget for a specific category could have a navigation action to '/dashboard/budgets'.
- A tip about setting a savings goal could have an action to open the 'add_goal' dialog.
- A tip about cutting spending in a category could link to transactions: '/dashboard/transactions?category=Dining'.

If you analyze the data and find no significant areas for improvement, or if all potential tips are too similar to the starred tips, return an empty "tips" array and provide a friendly, encouraging message in the "message" field, like "Your financial health looks good! Keep up the great work." or "Based on your current spending, you are doing a great job managing your finances."

Return a JSON object with a "tips" array, and an optional "message". Each object in the "tips" array should have a "tip" (string) and an optional "action" object with "type" and "payload".`,
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
