
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
import type { Budget as Saving } from '@/lib/types';
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

export default function SavingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [savingToEdit, setSavingToEdit] = useState<Saving | undefined>(undefined);
  const [savingToDelete, setSavingToDelete] = useState<Saving | null>(null);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);

  const savingsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [user, firestore]);

  const { data: savings, isLoading } = useCollection<Saving>(savingsQuery);

  const handleEdit = (saving: Saving) => {
    if (saving.isGoal) {
        toast({
            variant: 'default',
            title: 'Goal-Linked Saving Plan',
            description: 'This saving plan is linked to a goal and cannot be edited directly. Adjust the goal instead.'
        });
        return;
    }
    setSavingToEdit(saving);
    setIsAddSavingOpen(true);
  };
  
  const handleAddNew = () => {
    setSavingToEdit(undefined);
    setIsAddSavingOpen(true);
  };

  const handleDelete = (saving: Saving) => {
    if (!user) return;
    if (saving.isGoal) {
        toast({
            variant: 'destructive',
            title: 'Cannot Delete',
            description: 'This saving plan is linked to a goal. Delete the goal to remove this plan.'
        });
        setSavingToDelete(null);
        return;
    }
    const savingDocRef = doc(firestore, `users/${user.uid}/budgets`, saving.id);
    deleteDocumentNonBlocking(savingDocRef);
    toast({
      title: "Saving Plan Deleted",
      description: `The "${saving.category}" plan has been deleted.`,
    });
    setSavingToDelete(null);
  };

  return (
    <>
      <PageHeader title="Savings" description="Manage your monthly savings plans.">
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Saving Plan
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
        {!isLoading && savings && savings.map((saving) => {
          const progress = (saving.spent / saving.amount) * 100;
          return (
            <Card key={saving.id} className={cn(saving.isGoal && "bg-muted/50 border-dashed")}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{saving.category}</CardTitle>
                <CardDescription>{formatCurrency(saving.amount, currency)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saved</span>
                    <span className="font-medium">{formatCurrency(saving.spent, currency)}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={cn("font-medium", saving.amount - saving.spent < 0 ? 'text-destructive' : 'text-emerald-600' )}>
                        {formatCurrency(saving.amount - saving.spent, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                 <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(saving)}>
                    Adjust Plan
                 </Button>
                 <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setSavingToDelete(saving)}>
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </CardFooter>
            </Card>
          )
        })}
        {!isLoading && (!savings || savings.length === 0) && (
            <Card className="md:col-span-2 lg:col-span-3 flex items-center justify-center h-64">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No Savings Plans Found</h3>
                    <p className="text-muted-foreground">Create a saving plan to start tracking your goals.</p>
                </div>
            </Card>
        )}
      </div>

       <AddBudgetDialog 
        open={isAddSavingOpen}
        onOpenChange={setIsAddSavingOpen}
        budget={savingToEdit}
      >
        <span />
      </AddBudgetDialog>

       <AlertDialog open={!!savingToDelete} onOpenChange={(open) => !open && setSavingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the saving plan for {'"'}
              {savingToDelete?.category}{'"'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => savingToDelete && handleDelete(savingToDelete)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
