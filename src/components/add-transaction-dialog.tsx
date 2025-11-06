
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { suggestTransactionCategory } from '@/app/actions';
import { useUser, useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Account } from '@/lib/types';


const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  accountId: z.string({ required_error: 'Please select an account.' }),
  date: z.date({ required_error: 'A date is required.' }),
  category: z.string({ required_error: 'Please select a category.' }),
});

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      date: new Date(),
    },
  });
  
  useEffect(() => {
    if (!open) {
      form.reset({
        type: 'expense',
        amount: 0,
        description: '',
        date: new Date(),
        accountId: undefined,
        category: undefined
      });
    }
  }, [open, form]);

  const handleSuggestCategory = async () => {
    const description = form.getValues('description');
    const amount = form.getValues('amount');
    const accountId = form.getValues('accountId');
    const account = accounts?.find(a => a.id === accountId);
    
    if (!description || !amount || !account) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Please fill in description, amount, and account first.',
      });
      return;
    }
    
    setIsSuggesting(true);
    try {
      const result = await suggestTransactionCategory({
        description,
        amount,
        accountType: account.type,
      });
      if (result.category) {
        form.setValue('category', result.category);
        toast({
          title: 'Category Suggested!',
          description: `We suggest "${result.category}" with ${Math.round(result.confidence * 100)}% confidence.`,
        });
      } else {
        throw new Error('No category returned.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Error',
        description: 'Could not suggest a category. Please select one manually.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    if (!user || !accounts) {
       toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and have accounts.' });
       return;
    }
    const transactionsCollection = collection(firestore, `users/${user.uid}/transactions`);
    const notificationsCollection = collection(firestore, `users/${user.uid}/notifications`);
    const accountRef = doc(firestore, `users/${user.uid}/accounts`, values.accountId);
    
    const account = accounts.find(a => a.id === values.accountId);
    if (!account) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected account not found.' });
      return;
    }

    // 1. Add the transaction
    addDocumentNonBlocking(transactionsCollection, {
        ...values,
        userId: user.uid,
        date: values.date.toISOString()
    });

    // 2. Update account balance
    const newBalance = values.type === 'income' 
      ? account.balance + values.amount 
      : account.balance - values.amount;
    updateDocumentNonBlocking(accountRef, { balance: newBalance });

    // 3. Create a notification
    const currency = account.currency || 'USD';
    const notificationMessage = values.type === 'income'
      ? `Credited ${formatCurrency(values.amount, currency)} for "${values.description}"`
      : `Deducted ${formatCurrency(values.amount, currency)} for "${values.description}"`;
    
    addDocumentNonBlocking(notificationsCollection, {
      userId: user.uid,
      message: notificationMessage,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    toast({
      title: 'Transaction Added',
      description: `Successfully added ${values.type} of ${formatCurrency(values.amount, currency)}.`,
    });
    setOpen(false);
  };

  const categories: string[] = ['Groceries', 'Dining', 'Entertainment', 'Utilities', 'Transportation', 'Healthcare', 'Shopping', 'Income', 'Transfer', 'Other'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details of your transaction below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Expense</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Income</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Coffee with friends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoadingAccounts}>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" type="button" onClick={handleSuggestCategory} disabled={isSuggesting || isLoadingAccounts}>
                      <Sparkles className={cn("h-4 w-4", isSuggesting && "animate-spin")} />
                    </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add Transaction</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    