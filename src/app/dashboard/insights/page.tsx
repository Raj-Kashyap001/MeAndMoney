'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialTips } from '@/app/actions';
import { mockTransactions, mockBudgets } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AddBudgetDialog } from '@/components/add-budget-dialog';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import type { FinancialTipsOutput } from '@/ai/flows/financial-tips-from-spending';

type Tip = FinancialTipsOutput['tips'][0];

export default function InsightsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const handleGenerateTips = async () => {
    setIsLoading(true);
    setTips([]);
    try {
      const spendingData = mockBudgets.map(b => ({ category: b.category, spent: b.spent }));
      const income = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      const result = await getFinancialTips({
        spendingData: JSON.stringify(spendingData),
        income: income,
      });

      if (result.tips && result.tips.length > 0) {
        setTips(result.tips);
        toast({
          title: 'Insights Generated!',
          description: 'We have some new financial tips for you.'
        });
      } else {
        throw new Error('No tips were generated.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Tips',
        description: 'There was an error while generating your financial tips. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (tip: Tip) => {
    if (!tip.action) return;

    const { type, payload } = tip.action;
    if (type === 'navigate') {
      router.push(payload);
    } else if (type === 'open_dialog') {
      if (payload === 'add_budget') {
        setIsAddBudgetOpen(true);
      } else if (payload === 'add_goal') {
        setIsAddGoalOpen(true);
      }
    }
  };

  return (
    <>
      <PageHeader
        title="AI Insights"
        description="Get personalized financial tips based on your spending."
      >
        <Button onClick={handleGenerateTips} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Generate Tips
        </Button>
      </PageHeader>
      <div className="flex items-center justify-center grow">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Your Financial Tips</CardTitle>
            <CardDescription>
              Our AI has analyzed your spending and here are some ways you could save money.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tips.length > 0 ? (
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50">
                    <div className="flex items-start gap-4">
                      <span className="text-xl mt-1">💡</span>
                      <p className="text-card-foreground">{tip.tip}</p>
                    </div>
                    {tip.action && (
                      <Button variant="ghost" size="sm" onClick={() => handleAction(tip)}>
                        Take Action <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Click "Generate Tips" to get your personalized financial advice.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AddBudgetDialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
        <span />
      </AddBudgetDialog>
      <AddGoalDialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <span />
      </AddGoalDialog>
    </>
  );
}
