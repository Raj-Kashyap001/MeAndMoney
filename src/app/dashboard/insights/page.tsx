'use client';

import { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialTips } from '@/app/actions';
import { mockTransactions, mockBudgets } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function InsightsPage() {
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        <Card className="w-full max-w-2xl">
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
              <ul className="space-y-4">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="text-xl mt-1">💡</span>
                    <p className="text-card-foreground">{tip}</p>
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
    </>
  );
}
