
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AddBudgetDialog } from '@/components/add-budget-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Budget } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';

const getProgressColor = (value: number) => {
  if (value > 90) return 'bg-destructive';
  if (value > 75) return 'bg-yellow-500';
  return 'bg-primary';
};

export default function BudgetsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();

  const budgetsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [user, firestore]);

  const { data: budgets, isLoading } = useCollection<Budget>(budgetsQuery);

  return (
    <>
      <PageHeader title="Budgets" description="Manage your monthly spending limits.">
        <AddBudgetDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </AddBudgetDialog>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
            [...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))
        )}
        {!isLoading && budgets && budgets.map((budget) => {
          const progress = (budget.spent / budget.amount) * 100;
          return (
            <Card key={budget.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{budget.category}</CardTitle>
                <CardDescription>{formatCurrency(budget.amount, currency)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{formatCurrency(budget.spent, currency)}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={cn("font-medium", budget.amount - budget.spent < 0 ? 'text-destructive' : 'text-emerald-600' )}>
                        {formatCurrency(budget.amount - budget.spent, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 <AddBudgetDialog budget={budget}>
                  <Button variant="outline" size="sm" className="w-full">Adjust Budget</Button>
                </AddBudgetDialog>
              </CardFooter>
            </Card>
          )
        })}
        {!isLoading && (!budgets || budgets.length === 0) && (
            <Card className="md:col-span-2 lg:col-span-3 flex items-center justify-center h-64">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No Budgets Found</h3>
                    <p className="text-muted-foreground">Create a budget to start tracking your spending.</p>
                </div>
            </Card>
        )}
      </div>
    </>
  );
}

    