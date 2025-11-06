import type { Account, Transaction, Budget, Goal } from './types';

export const mockAccounts: Account[] = [
  { id: 'acc1', name: 'Chase Checking', type: 'bank', balance: 5210.55, bankName: 'Chase' },
  { id: 'acc2', name: 'Amex Gold', type: 'card', balance: -750.28, bankName: 'American Express' },
  { id: 'acc3', name: 'Wallet', type: 'cash', balance: 320.0 },
  { id: 'acc4', name: 'Wealthfront Savings', type: 'bank', balance: 25000.0, bankName: 'Wealthfront' },
];

export const mockTransactions: Transaction[] = [
  { id: 'txn1', date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), description: 'Trader Joe\'s', amount: -85.4, type: 'expense', category: 'Groceries', accountId: 'acc2' },
  { id: 'txn2', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), description: 'Paycheck', amount: 2500, type: 'income', category: 'Income', accountId: 'acc1' },
  { id: 'txn3', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), description: 'Netflix Subscription', amount: -15.99, type: 'expense', category: 'Entertainment', accountId: 'acc2' },
  { id: 'txn4', date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), description: 'Shell Gas', amount: -55.2, type: 'expense', category: 'Transportation', accountId: 'acc2' },
  { id: 'txn5', date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(), description: 'Dinner at The Olive Tree', amount: -120.0, type: 'expense', category: 'Dining', accountId: 'acc2' },
  { id: 'txn6', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), description: 'ATM Withdrawal', amount: -100.0, type: 'expense', category: 'Transfer', accountId: 'acc1' },
  { id: 'txn7', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), description: 'Cash Deposit', amount: 100.0, type: 'income', category: 'Transfer', accountId: 'acc3' },
  { id: 'txn8', date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(), description: 'Electric Bill', amount: -75.0, type: 'expense', category: 'Utilities', accountId: 'acc1' },
];

export const mockBudgets: Budget[] = [
  { id: 'bud1', category: 'Groceries', amount: 500, spent: 210.3 },
  { id: 'bud2', category: 'Dining', amount: 300, spent: 250.7 },
  { id: 'bud3', category: 'Entertainment', amount: 150, spent: 80.0 },
  { id: 'bud4', category: 'Transportation', amount: 200, spent: 110.5 },
  { id: 'bud5', category: 'Shopping', amount: 400, spent: 390.0 },
];

export const mockGoals: Goal[] = [
    { id: 'goal1', name: 'Vacation to Hawaii', targetAmount: 5000, currentAmount: 1200, deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString() },
    { id: 'goal2', name: 'New Laptop', targetAmount: 2000, currentAmount: 1800, deadline: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString() },
];
