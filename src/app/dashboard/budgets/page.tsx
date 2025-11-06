import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockBudgets } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const getProgressColor = (value: number) => {
  if (value > 90) return 'bg-destructive';
  if (value > 75) return 'bg-yellow-500';
  return 'bg-primary';
};

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Budgets" description="Manage your monthly spending limits.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockBudgets.map((budget) => {
          const progress = (budget.spent / budget.amount) * 100;
          return (
            <Card key={budget.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{budget.category}</CardTitle>
                <CardDescription>{formatCurrency(budget.amount)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{formatCurrency(budget.spent)}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={cn("font-medium", budget.amount - budget.spent < 0 ? 'text-destructive' : 'text-emerald-600' )}>
                        {formatCurrency(budget.amount - budget.spent)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">Adjust Budget</Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </>
  );
}
