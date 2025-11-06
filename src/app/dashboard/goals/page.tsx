'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockGoals } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { AddGoalDialog } from '@/components/add-goal-dialog';

export default function GoalsPage() {
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
        {mockGoals.map((goal) => {
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
                  <span>{formatCurrency(goal.currentAmount)}</span>
                  <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
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
      </div>
    </>
  );
}
