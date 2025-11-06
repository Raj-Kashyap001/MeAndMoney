
'use client';

import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Goal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [user, firestore]);

  const { data: goals, isLoading } = useCollection<Goal>(goalsQuery);

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsAddGoalOpen(true);
  };

  const handleAddNew = () => {
    setGoalToEdit(undefined);
    setIsAddGoalOpen(true);
  };
  
  const handleDelete = (goal: Goal) => {
    if (!user) return;
    const goalDocRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
    deleteDocumentNonBlocking(goalDocRef);
    toast({
      title: "Goal Deleted",
      description: `The "${goal.name}" goal has been deleted.`,
    });
    setGoalToDelete(null);
  };

  const handleContribute = (goal: Goal) => {
    // This is a placeholder for a more complex contribution flow
    // For now, we'll just open the edit dialog
    handleEdit(goal);
    toast({
        title: 'Contribute to Goal',
        description: 'You can add to your saved amount here.'
    });
  }


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
          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle>{goal.name}</CardTitle>
                <CardDescription>
                  Deadline: {format(new Date(goal.deadline), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progress} />
                <div className="flex justify-between text-sm font-medium">
                  <span>{formatCurrency(goal.currentAmount, currency)}</span>
                  <span className="text-muted-foreground">{formatCurrency(goal.targetAmount, currency)}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(goal)}>Adjust Goal</Button>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleContribute(goal)}>Contribute</Button>
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

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the goal for {'"'}
              {goalToDelete?.name}{'"'}.
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
