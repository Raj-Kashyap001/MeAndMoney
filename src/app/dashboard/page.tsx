
'use client';

import { PlusCircle, Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/page-header';
import { formatCurrency } from '@/lib/utils';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { format } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Account, Transaction, Budget as Saving } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();

  const accountsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/accounts`)) : null,
    [user, firestore]
  );
  const transactionsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('date', 'desc'), limit(5)) : null,
    [user, firestore]
  );
  const savingsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/budgets`)) : null,
    [user, firestore]
  );

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);
  const { data: savings, isLoading: isLoadingSavings } = useCollection<Saving>(savingsQuery);

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;
  const totalSavingTarget = savings?.reduce((sum, saving) => sum + saving.amount, 0) ?? 0;
  const totalSaved = savings?.reduce((sum, saving) => sum + saving.spent, 0) ?? 0;

  const thisMonthIncome = transactions
    ?.filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const thisMonthExpenses = transactions
    ?.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0) ?? 0;

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
        <AddTransactionDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </AddTransactionDialog>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance, currency)} icon={Wallet} description="Across all accounts" isLoading={isLoadingAccounts} />
        <StatCard title="Income" value={formatCurrency(thisMonthIncome, currency)} icon={TrendingUp} description="This month" isLoading={isLoadingTransactions} />
        <StatCard title="Expenses" value={formatCurrency(thisMonthExpenses, currency)} icon={TrendingDown} description="This month" isLoading={isLoadingTransactions} />
        <StatCard title="Savings Progress" value={`${formatCurrency(totalSaved, currency)} / ${formatCurrency(totalSavingTarget, currency)}`} icon={Target} description={`${(totalSavingTarget > 0 ? (totalSaved / totalSavingTarget * 100) : 0).toFixed(0)}% of saving target met`} isLoading={isLoadingSavings} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div className="font-medium">{txn.description}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(txn.date), 'MMM dd')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.category}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${txn.type === 'income' ? 'text-green-600' : ''}`}>
                        {formatCurrency(txn.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No recent transactions.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Savings</CardTitle>
            <CardDescription>Your saving goals for this month.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isLoadingSavings ? (
              [...Array(2)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : savings && savings.length > 0 ? (
              savings.map((saving) => {
                const progress = (saving.spent / saving.amount) * 100;
                return (
                  <div key={saving.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{saving.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(saving.spent, currency)} / {formatCurrency(saving.amount, currency)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No savings plans created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
