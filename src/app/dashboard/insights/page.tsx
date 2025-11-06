
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Loader2, ArrowRight, Star, Download, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFinancialTips } from '@/app/actions';
import { mockTransactions } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { AddBudgetDialog } from '@/components/add-budget-dialog';
import { AddGoalDialog } from '@/components/add-goal-dialog';
import type { FinancialTipsOutput } from '@/ai/flows/financial-tips-from-spending';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Budget as Saving } from '@/lib/types';

type Tip = FinancialTipsOutput['tips'][0] & { id: string };

export default function InsightsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [starredTips, setStarredTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [allGoodMessage, setAllGoodMessage] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const savingsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, `users/${user.uid}/budgets`)) : null,
    [firestore, user]
  );
  const { data: savings } = useCollection<Saving>(savingsQuery);

  useEffect(() => {
    const storedStarredTips = localStorage.getItem('starredTips');
    if (storedStarredTips) {
      setStarredTips(JSON.parse(storedStarredTips));
    }
  }, []);

  const handleGenerateTips = async () => {
    setIsLoading(true);
    setTips([]);
    setAllGoodMessage(null);
    try {
      const spendingData = savings?.map(s => ({ category: s.category, spent: s.spent })) ?? [];
      // This part is still using mock data, should be replaced with real transactions later
      const income = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      const result = await getFinancialTips({
        spendingData: JSON.stringify(spendingData),
        income: income,
        starredTips: starredTips.map(t => t.tip),
      });

      if (result.tips && result.tips.length > 0) {
        setTips(result.tips.map((tip, index) => ({ ...tip, id: `new-${index}` })));
        toast({
          title: 'Insights Generated!',
          description: 'We have some new financial tips for you.'
        });
      } else {
        setAllGoodMessage(result.message || "Your financial health looks good! No new tips right now.");
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
      router.push(payload.replace('/budgets', '/savings'));
    } else if (type === 'open_dialog') {
      if (payload === 'add_budget') {
        setIsAddBudgetOpen(true);
      } else if (payload === 'add_goal') {
        setIsAddGoalOpen(true);
      }
    }
  };

  const handleStarTip = (tip: Tip) => {
    const newStarredTips = [...starredTips, tip];
    setStarredTips(newStarredTips);
    localStorage.setItem('starredTips', JSON.stringify(newStarredTips));
    setTips(tips.filter(t => t.id !== tip.id));
    toast({ title: 'Tip Starred!', description: 'It has been moved to your starred tips.' });
  };
  
  const handleUnstarTip = (tip: Tip) => {
    const newStarredTips = starredTips.filter(t => t.id !== tip.id);
    setStarredTips(newStarredTips);
    localStorage.setItem('starredTips', JSON.stringify(newStarredTips));
    setTips([tip, ...tips]);
    toast({ title: 'Tip Unstarred!', description: 'It has been moved back to new tips.' });
  };

  const exportTips = (tipsToExport: Tip[]) => {
    const headers = ["Tip", "Action Type", "Action Payload"];
    const csvContent = [
      headers.join(','),
      ...tipsToExport.map(tip => [
        `"${tip.tip.replace(/"/g, '""')}"`,
        tip.action?.type || '',
        tip.action?.payload || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "financial-tips.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Tips Exported", description: "Your tips have been downloaded as a CSV file."});
  };

  const TipItem = ({ tip, isStarred }: { tip: Tip, isStarred: boolean }) => (
    <li className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50">
      <div className="flex items-start gap-4">
        <span className="text-xl mt-1">💡</span>
        <p className="text-card-foreground">{tip.tip}</p>
      </div>
      <div className="flex items-center gap-2">
        {tip.action && (
          <Button variant="ghost" size="sm" onClick={() => handleAction(tip)}>
            Take Action <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => isStarred ? handleUnstarTip(tip) : handleStarTip(tip)}>
              <Star className="mr-2 h-4 w-4" />
              {isStarred ? 'Unstar Tip' : 'Star Tip'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportTips([tip])}>
              <Download className="mr-2 h-4 w-4" />
              Export Tip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );

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
      <div className="flex flex-col gap-8 grow">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Your New Financial Tips</CardTitle>
            <CardDescription>
              Our AI has analyzed your spending. Here are some new ways you could save money.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tips.length > 0 ? (
              <ul className="space-y-2">
                {tips.map((tip) => <TipItem key={tip.id} tip={tip} isStarred={false} />)}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>{allGoodMessage || 'Click "Generate Tips" to get your personalized financial advice.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {starredTips.length > 0 && (
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Starred Tips</CardTitle>
                <CardDescription>
                  Your saved collection of financial advice.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportTips(starredTips)}>
                <Download className="mr-2 h-4 w-4" />
                Export All Starred
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {starredTips.map((tip) => <TipItem key={tip.id} tip={tip} isStarred={true} />)}
              </ul>
            </CardContent>
          </Card>
        )}
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
