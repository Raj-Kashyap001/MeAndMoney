
'use client';

import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, where, getDocs } from 'firebase/firestore';
import type { Goal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ContributeToGoalDialog } from '@/components/contribute-to-goal-dialog';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears, isValid } from 'date-fns';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);
  const [goalToContribute, setGoalToContribute] = useState<Goal | undefined>(undefined);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isContributeGoalOpen, setIsContributeGoalOpen] = useState(false);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [firestore, user]);

  const { data: goals, isLoading } = useCollection<Goal>(goalsQuery);

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsAddGoalOpen(true);
  };

  const handleAddNew = () => {
    setGoalToEdit(undefined);
    setIsAddGoalOpen(true);
  };
  
  const handleDelete = async (goal: Goal) => {
    if (!user) return;
    // 1. Delete the goal document
    const goalDocRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
    deleteDocumentNonBlocking(goalDocRef);
    
    // 2. Delete the associated budget document if it exists
    if (goal.savingStrategy !== 'self-dependent') {
      const budgetCategory = `Goal: ${goal.name}`;
      const budgetsRef = collection(firestore, `users/${user.uid}/budgets`);
      const budgetQuery = query(budgetsRef, where("category", "==", budgetCategory));
      const budgetSnapshot = await getDocs(budgetQuery);
      if (!budgetSnapshot.empty) {
        const budgetDoc = budgetSnapshot.docs[0];
        deleteDocumentNonBlocking(budgetDoc.ref);
      }
    }

    toast({
      title: "Goal Deleted",
      description: `The "${goal.name}" goal and its linked saving plan have been deleted.`,
    });
    setGoalToDelete(null);
  };

  const handleContribute = (goal: Goal) => {
    setGoalToContribute(goal);
    setIsContributeGoalOpen(true);
  }

  const calculateExpectedCompletion = (goal: Goal): Date | null => {
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    if (goal.savingStrategy === 'self-dependent' || goal.periodicContribution <= 0 || remainingAmount <= 0) {
      return null;
    }

    const periodsToComplete = Math.ceil(remainingAmount / goal.periodicContribution);
    const now = new Date();

    switch (goal.savingStrategy) {
      case 'daily': return addDays(now, periodsToComplete);
      case 'weekly': return addWeeks(now, periodsToComplete);
      case 'monthly': return addMonths(now, periodsToComplete);
      case 'quarterly': return addQuarters(now, periodsToComplete);
      case 'yearly': return addYears(now, periodsToComplete);
      default: return null;
    }
  };


  return (
    <>
      <PageHeader title="Goals" description="Track your progress towards your financial goals.">
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Goal
        </Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
            [...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-12 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))
        )}
        {!isLoading && goals && goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const expectedCompletionDate = calculateExpectedCompletion(goal);
          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle>{goal.name}</CardTitle>
                <CardDescription>
                  {goal.savingStrategy === 'self-dependent' 
                    ? 'Self-dependent goal' 
                    : (expectedCompletionDate ? `Est. Completion: ${format(expectedCompletionDate, 'MMM yyyy')}` : 'No active saving plan')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progress} />
                <div className="flex justify-between text-sm font-medium">
                  <span>{formatCurrency(goal.currentAmount, currency)}</span>
                  <span className="text-muted-foreground">{formatCurrency(goal.targetAmount, currency)}</span>
                </div>
                {goal.savingStrategy !== 'self-dependent' && (
                  <div className="text-sm text-muted-foreground pt-2">
                    {`Save ${formatCurrency(goal.periodicContribution, currency)} / ${goal.savingStrategy.replace('ly','')}`}
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(goal)}>Adjust Goal</Button>
                <Button size="sm" className="w-full" onClick={() => handleContribute(goal)}>Contribute</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setGoalToDelete(goal)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
         {!isLoading && (!goals || goals.length === 0) && (
            <Card className="md:col-span-2 lg:col-span-3 flex items-center justify-center h-64">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">No Goals Found</h3>
                    <p className="text-muted-foreground">Add a financial goal to get started.</p>
                </div>
            </Card>
        )}
      </div>

      <AddGoalDialog 
        open={isAddGoalOpen}
        onOpenChange={setIsAddGoalOpen}
        goal={goalToEdit}
      >
        <span />
      </AddGoalDialog>

      {goalToContribute && (
        <ContributeToGoalDialog
          open={isContributeGoalOpen}
          onOpenChange={setIsContributeGoalOpen}
          goal={goalToContribute}
        >
          <span />
        </ContributeToGoalDialog>
      )}

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal for {'"'}
              {goalToDelete?.name}{'"'} and its linked saving plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => goalToDelete && handleDelete(goalToDelete)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
