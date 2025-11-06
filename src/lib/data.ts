import type { Account, Transaction, Budget, Goal } from './types';

// Mock data is no longer used, but the file is kept for type imports
// and to avoid breaking changes in other files that might still import it.
// In a real application, data is now fetched from Firestore.

export const mockAccounts: Account[] = [];

export const mockTransactions: Transaction[] = [];

export const mockBudgets: Budget[] = [];

export const mockGoals: Goal[] = [];
