export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type Account = {
  id: string;
  name: string;
  type: 'bank' | 'card' | 'cash';
  balance: number;
  bankName?: string;
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
  | 'Other';

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  accountId: string;
};

export type Budget = {
  id: string;
  category: Category;
  amount: number;
  spent: number;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
};
