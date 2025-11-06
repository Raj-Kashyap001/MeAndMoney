

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  currency?: string;
};

export type Account = {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'card' | 'cash';
  balance: number;
  bankName?: string;
  currency?: string;
};

export type Category =
  | 'Groceries'
  | 'Dining'
  | 'Entertainment'
  | 'Utilities'
  | 'Transportation'
  | 'Healthcare'
  | 'Shopping'
  | 'Income'
  | 'Transfer'
  | 'Other'
  | 'Savings';

export type Transaction = {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category | string;
  accountId: string;
};

export type Budget = {
  id: string;
  userId: string;
  category: Category | string;
  amount: number;
  spent: number;
  isGoal?: boolean;
  goalId?: string;
};

export type SavingStrategy = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  savingStrategy: SavingStrategy;
  periodicContribution: number;
};

export type Notification = {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'ai';
  isRead: boolean;
  createdAt: string;
};

    

    
