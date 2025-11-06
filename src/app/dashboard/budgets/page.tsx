
'use client';

import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AddBudgetDialog } from '@/components/add-budget-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Budget } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const getProgressColor = (value: number) => {
  if (value > 90) return 'bg-destructive';
  if (value > 75) return 'bg-yellow-500';
  return 'bg-primary';
};

export default function BudgetsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [budgetToEdit, setBudgetToEdit] = useState<Budget | undefined>(undefined);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);

  const budgetsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [user, firestore]);

  const { data: budgets, isLoading } = useCollection<Budget>(budgetsQuery);

  const handleEdit = (budget: Budget) => {
    if (budget.isGoal) {
        toast({
            variant: 'default',
            title: 'Goal-Linked Budget',
            description: 'This budget is linked to a goal and cannot be edited directly. Adjust the goal instead.'
        });
        return;
    }
    setBudgetToEdit(budget);
    setIsAddBudgetOpen(true);
  };
  
  const handleAddNew = () => {
    setBudgetToEdit(undefined);
    setIsAddBudgetOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    if (!user) return;
    if (budget.isGoal) {
        toast({
            variant: 'destructive',
            title: 'Cannot Delete',
            description: 'This budget is linked to a goal. Delete the goal to remove this budget.'
        });
        setBudgetToDelete(null);
        return;
    }
    const budgetDocRef = doc(firestore, `users/${user.uid}/budgets`, budget.id);
    deleteDocumentNonBlocking(budgetDocRef);
    toast({
      title: "Budget Deleted",
      description: `The "${budget.category}" budget has been deleted.`,
    });
    setBudgetToDelete(null);
  };

  return (
    <>
      <PageHeader title="Budgets" description="Manage your monthly spending limits.">
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Budget
        </Button>
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
            <Card key={budget.id} className={cn(budget.isGoal && "bg-muted/50 border-dashed")}>
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
              <CardFooter className="gap-2">
                 <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(budget)}>
                    Adjust Budget
                 </Button>
                 <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setBudgetToDelete(budget)}>
                    <Trash2 className="h-4 w-4" />
                 </Button>
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

       <AddBudgetDialog 
        open={isAddBudgetOpen}
        onOpenChange={setIsAddBudgetOpen}
        budget={budgetToEdit}
      >
        <span />
      </AddBudgetDialog>

       <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the budget for {'"'}
              {budgetToDelete?.category}{'"'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => budgetToDelete && handleDelete(budgetToDelete)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
