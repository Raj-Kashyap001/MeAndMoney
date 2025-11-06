
'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, CheckCircle } from 'lucide-react';
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
import { ContributeToGoalDialog } from '@/components/contribute-to-goal-dialog';
import type { Goal } from '@/lib/types';

export default function SavingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [savingToEdit, setSavingToEdit] = useState<Saving | undefined>(undefined);
  const [savingToDelete, setSavingToDelete] = useState<Saving | null>(null);
  const [isAddSavingOpen, setIsAddSavingOpen] = useState(false);
  const [goalToContribute, setGoalToContribute] = useState<Goal | undefined>(undefined);
  const [isContributeGoalOpen, setIsContributeGoalOpen] = useState(false);


  const savingsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/budgets`));
  }, [user, firestore]);

  const { data: savings, isLoading } = useCollection<Saving>(savingsQuery);
  
  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [user, firestore]);

  const { data: goals } = useCollection<Goal>(goalsQuery);

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

  const handleContribute = (saving: Saving) => {
    const relatedGoal = goals?.find(g => g.id === saving.goalId);
    if (relatedGoal) {
        setGoalToContribute(relatedGoal);
        setIsContributeGoalOpen(true);
    } else {
        toast({
            variant: 'destructive',
            title: 'Goal not found',
            description: 'Could not find the goal associated with this saving plan.'
        })
    }
  }

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
          const progress = saving.amount > 0 ? (saving.spent / saving.amount) * 100 : 0;
          const isGoalSaving = saving.isGoal;
          const goal = goals?.find(g => g.id === saving.goalId);
          const goalTitle = goal?.name.replace('Goal: ', '');
          const strategy = goal?.savingStrategy ? `this ${goal.savingStrategy.replace('ly', '')}` : '';
          const isGoalReached = goal ? goal.currentAmount >= goal.targetAmount : false;


          return (
            <Card key={saving.id} className={cn(saving.isGoal && "bg-muted/50 border-dashed")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{isGoalSaving && goalTitle ? `Saving for ${goalTitle}` : saving.category}</CardTitle>
                <CardDescription>{isGoalSaving ? `Amount to save ${strategy}` : 'Monthly Plan'}</CardDescription>
              </CardHeader>
              <CardContent>
                 <p className="text-2xl font-bold text-primary mb-4">{formatCurrency(saving.amount, currency)}</p>
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saved so far</span>
                    <span className="font-medium">{formatCurrency(saving.spent, currency)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                 {isGoalSaving ? (
                     isGoalReached ? (
                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-default" disabled>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Goal Reached!
                        </Button>
                     ) : (
                        <Button size="sm" className="w-full" onClick={() => handleContribute(saving)}>Contribute</Button>
                     )
                 ) : (
                    <>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(saving)}>
                            Adjust Plan
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setSavingToDelete(saving)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                 )}
              </CardFooter>
            </Card>
          )
        })}
        {!isLoading && (!savings || savings.length === 0) && (
            <Card className="md:col-span-2 lg:col-span-3 flex items-center justify-center h-64">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No Savings Plans Found</h3>
                    <p className="text-muted-foreground">Create a saving plan or a goal to get started.</p>
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

      {goalToContribute && (
        <ContributeToGoalDialog
            open={isContributeGoalOpen}
            onOpenChange={setIsContributeGoalOpen}
            goal={goalToContribute}
        >
            <span />
        </ContributeToGoalDialog>
      )}

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
