
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import type { Account, Goal, Budget as Saving } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/components/currency-provider';


const contributionSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Contribution amount must be positive.' }),
  fromAccountId: z.string({ required_error: 'Please select an account to contribute from.' }),
});

type ContributeToGoalDialogProps = {
  children: React.ReactNode;
  goal: Goal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};


export function ContributeToGoalDialog({ children, goal, open: controlledOpen, onOpenChange: setControlledOpen }: ContributeToGoalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const accountsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [firestore, user]);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);


  const form = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: 0,
        fromAccountId: undefined,
      });
    }
  }, [goal, open, form]);

  const onSubmit = async (values: z.infer<typeof contributionSchema>) => {
    if (!user || !accounts) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and have accounts.' });
      return;
    }

    const fromAccount = accounts.find(a => a.id === values.fromAccountId);
    if (!fromAccount) {
        toast({ variant: 'destructive', title: 'Error', description: 'The selected source account was not found.' });
        return;
    }
    
    if (fromAccount.balance < values.amount) {
        toast({ variant: 'destructive', title: 'Insufficient Funds', description: `Your "${fromAccount.name}" source does not have enough funds.` });
        return;
    }
    
    setIsSubmitting(true);

    try {
        // 1. Update Goal's current amount
        const goalDocRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
        const newCurrentAmount = goal.currentAmount + values.amount;
        updateDocumentNonBlocking(goalDocRef, { currentAmount: newCurrentAmount });

        // 2. Update the source account's balance
        const accountDocRef = doc(firestore, `users/${user.uid}/accounts`, values.fromAccountId);
        const newBalance = fromAccount.balance - values.amount;
        updateDocumentNonBlocking(accountDocRef, { balance: newBalance });

        // 3. Update the linked saving plan's spent amount
        const savingCategory = `Goal: ${goal.name}`;
        const savingsCollectionRef = collection(firestore, `users/${user.uid}/budgets`);
        const savingQuery = query(savingsCollectionRef, where("category", "==", savingCategory));
        const savingSnapshot = await getDocs(savingQuery);

        if (!savingSnapshot.empty) {
            const savingDoc = savingSnapshot.docs[0];
            const savingData = savingDoc.data() as Saving;
            const newSpentAmount = savingData.spent + values.amount;
            updateDocumentNonBlocking(savingDoc.ref, { spent: newSpentAmount });
        }
        
        // 4. Create a transaction for this contribution
        const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
        const transactionData = {
          userId: user.uid,
          date: new Date().toISOString(),
          description: `Contribution to goal: ${goal.name}`,
          amount: values.amount,
          type: 'expense',
          category: 'Savings',
          accountId: values.fromAccountId,
        };
        addDocumentNonBlocking(transactionsCollection, transactionData);
        
        const notificationMessage = `Successfully saved ${formatCurrency(values.amount, fromAccount.currency || currency)} for your "${goal.name}" goal.`;
        addDocumentNonBlocking(collection(firestore, `users/${user.uid}/notifications`), {
            userId: user.uid,
            message: notificationMessage,
            type: 'info',
            isRead: false,
            createdAt: new Date().toISOString()
        });


        toast({
            title: 'Contribution Successful!',
            description: `You contributed ${formatCurrency(values.amount, fromAccount.currency || currency)} to your "${goal.name}" goal.`,
        });

        setOpen(false);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Contribution Failed',
            description: 'An unexpected error occurred. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const trigger = controlledOpen === undefined ? <DialogTrigger asChild>{children}</DialogTrigger> : children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to Goal</DialogTitle>
          <DialogDescription>
            Add funds to your &quot;{goal.name}&quot; goal. Your current progress is {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Amount (for this month&apos;s saving)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingAccounts}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance, account.currency || currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Contribute
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
