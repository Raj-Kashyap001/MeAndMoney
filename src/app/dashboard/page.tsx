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
import { mockAccounts, mockTransactions, mockBudgets, mockGoals } from '@/lib/data';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { format } from 'date-fns';

export default function DashboardPage() {
  const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalBudget = mockBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = mockBudgets.reduce((sum, budget) => sum + budget.spent, 0);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(2500)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(-432.39)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
            <Target className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              {(totalSpent / totalBudget * 100).toFixed(0)}% of budget used
            </p>
          </CardContent>
        </Card>
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
                {mockTransactions.slice(0, 5).map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <div className="font-medium">{txn.description}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(txn.date), 'MMM dd')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.category}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${txn.type === 'income' ? 'text-green-600' : ''}`}>
                      {formatCurrency(txn.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Your spending limits for this month.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {mockBudgets.map((budget) => {
              const progress = (budget.spent / budget.amount) * 100;
              return (
                <div key={budget.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{budget.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
