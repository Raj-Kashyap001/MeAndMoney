'use server';
import { suggestCategory, SuggestCategoryInput } from '@/ai/flows/categorize-transaction-with-ai';
import { getFinancialTips as getFinancialTipsFlow, FinancialTipsInput } from '@/ai/flows/financial-tips-from-spending';

export async function suggestTransactionCategory(input: SuggestCategoryInput) {
  try {
    const result = await suggestCategory(input);
    return result;
  } catch (error) {
    console.error('Error suggesting category:', error);
    return { category: '', confidence: 0 };
  }
}


export async function getFinancialTips(input: FinancialTipsInput) {
  try {
    const result = await getFinancialTipsFlow(input);
    return result;
  } catch (error) {
    console.error('Error getting financial tips:', error);
    return { tips: ['There was an error generating tips. Please try again later.'] };
  }
}
