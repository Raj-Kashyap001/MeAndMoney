
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Goal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`));
  }, [user, firestore]);

  const { data: goals, isLoading } = useCollection<Goal>(goalsQuery);

  return (
    <>
      <PageHeader title="Goals" description="Track your progress towards your financial goals.">
        <AddGoalDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </AddGoalDialog>
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
                <AddGoalDialog goal={goal}>
                   <Button variant="outline" size="sm" className="w-full">Adjust Goal</Button>
                </AddGoalDialog>
                 <Button variant="outline" size="sm" className="w-full">Contribute</Button>
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
    </>
  );
}

    