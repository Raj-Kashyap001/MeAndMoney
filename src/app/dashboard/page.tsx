
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, TrendingDown, Target, PlusCircle, Star, ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { formatCurrency } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Account, Transaction, Budget as Saving } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';
import { OverviewChart } from '@/components/charts/overview-chart';
import { SpendingBreakdownChart } from '@/components/charts/spending-breakdown-chart';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import type { FinancialTipsOutput } from '@/ai/flows/financial-tips-from-spending';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddBudgetDialog } from '@/components/add-budget-dialog';

type Tip = FinancialTipsOutput['tips'][0] & { id: string };

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const router = useRouter();

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [starredTips, setStarredTips] = useState<Tip[]>([]);

  useEffect(() => {
    const storedStarredTips = localStorage.getItem('starredTips');
    if (storedStarredTips) {
      setStarredTips(JSON.parse(storedStarredTips));
    }
  }, []);

  const handleAction = (tip: Tip) => {
    if (!tip.action) return;

    const { type, payload } = tip.action;
    if (type === 'navigate') {
      router.push(payload.replace('/budgets', '/savings'));
    } else if (type === 'open_dialog') {
      if (payload === 'add_budget') {
        setIsAddBudgetOpen(true);
      } else if (payload === 'add_goal') {
        setIsAddGoalOpen(true);
      }
    }
  };


  const { startOfMonth, startOfLast7Days } = useMemo(() => {
    const now = new Date();
    return {
      startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      startOfLast7Days: subDays(now, 6)
    };
  }, []);

  const accountsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, `users/${user.uid}/accounts`)) : null,
    [firestore, user]
  );
  const transactionsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, `users/${user.uid}/transactions`), where('date', '>=', startOfMonth.toISOString())) : null,
    [firestore, user, startOfMonth]
  );

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;
  
  const { totalIncome, totalExpenses, recentTransactionsData } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, recentTransactionsData: [] };

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    const dateMap: { [key: string]: { income: number; expense: number } } = {};

    for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), i), 'MMM d');
        dateMap[date] = { income: 0, expense: 0 };
    }
    
    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpenses += t.amount;
      }
      
      if (transactionDate >= startOfLast7Days) {
        const formattedDate = format(transactionDate, 'MMM d');
        if (dateMap[formattedDate]) {
          if (t.type === 'income') {
            dateMap[formattedDate].income += t.amount;
          } else {
            dateMap[formattedDate].expense += t.amount;
          }
        }
      }
    });

    const recentTransactionsData = Object.entries(dateMap).map(([date, { income, expense }]) => ({
      date,
      Income: income,
      Expense: expense,
    })).reverse();


    return { totalIncome, totalExpenses, recentTransactionsData };
  }, [transactions, startOfLast7Days]);
  
  
  const spendingByCategory = useMemo(() => {
    if (!transactions) return [];
    
    const categoryMap: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
      
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);


  const StatCard = ({ title, value, icon: Icon, description, isLoading }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader title="Dashboard" description={`Here is your financial overview for ${format(new Date(), 'MMMM yyyy')}.`}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddTransactionOpen(true)}>
            <PlusCircle /> Add Transaction
          </Button>
          <Button onClick={() => setIsAddGoalOpen(true)}>
            <PlusCircle /> Add Goal
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance, currency)} icon={Wallet} description="Across all accounts" isLoading={isLoadingAccounts} />
        <StatCard title="Income" value={formatCurrency(totalIncome, currency)} icon={TrendingUp} description="This month" isLoading={isLoadingTransactions} />
        <StatCard title="Expenses" value={formatCurrency(totalExpenses, currency)} icon={TrendingDown} description="This month" isLoading={isLoadingTransactions} />
        <StatCard title="Net Flow" value={formatCurrency(totalIncome - totalExpenses, currency)} icon={Target} description="This month's income minus expenses" isLoading={isLoadingTransactions} />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Income vs. Expense</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             {isLoadingTransactions ? <Skeleton className="h-[350px] w-full" /> : <OverviewChart data={recentTransactionsData} />}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>This month's expenses by category.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoadingTransactions ? <Skeleton className="h-[350px] w-full" /> : <SpendingBreakdownChart data={spendingByCategory} />}
          </CardContent>
        </Card>
      </div>

       {starredTips.length > 0 && (
        <Card className="lg:col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="text-yellow-400" /> Starred Insights
            </CardTitle>
            <CardDescription>
              Your saved collection of financial advice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {starredTips.slice(0, 3).map((tip) => (
                  <TableRow key={tip.id}>
                    <TableCell>{tip.tip}</TableCell>
                    <TableCell className="text-right">
                      {tip.action && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction(tip)}>
                          Take Action <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {starredTips.length > 3 && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => router.push('/dashboard/insights')}>
                    View All Starred Tips
                  </Button>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      <AddTransactionDialog 
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
      >
        <span />
      </AddTransactionDialog>

      <AddGoalDialog 
        open={isAddGoalOpen}
        onOpenChange={setIsAddGoalOpen}
      >
        <span />
      </AddGoalDialog>
      
      <AddBudgetDialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
        <span />
      </AddBudgetDialog>
    </>
  );
}
