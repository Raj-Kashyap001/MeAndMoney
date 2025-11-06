
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
import type { Budget } from '@/lib/types';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';


const budgetSchema = z.object({
  category: z.string({ required_error: 'Please select a category.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

const ALL_CATEGORIES: string[] = ['Groceries', 'Dining', 'Entertainment', 'Utilities', 'Transportation', 'Healthcare', 'Shopping', 'Income', 'Transfer', 'Other', 'Savings'];

type AddBudgetDialogProps = {
  children: React.ReactNode;
  budget?: Budget;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddBudgetDialog({ children, budget, open: controlledOpen, onOpenChange: setControlledOpen }: AddBudgetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const isEditMode = !!budget;

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const budgetsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/budgets`)) : null,
    [user, firestore]
  );
  const { data: existingBudgets } = useCollection<Budget>(budgetsQuery);


  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
  });
  
  useEffect(() => {
    if (open) {
        if (isEditMode && budget) {
            form.reset({
                category: budget.category,
                amount: budget.amount,
            });
        } else {
             form.reset({
                category: undefined,
                amount: 0,
            });
        }
    }
  }, [budget, open, form, isEditMode]);

  const availableCategories = ALL_CATEGORIES.filter(cat => 
    !existingBudgets?.some(b => b.category === cat) || (isEditMode && budget?.category === cat)
  );

  const onSubmit = (values: z.infer<typeof budgetSchema>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    
    if (!isEditMode && existingBudgets?.some(b => b.category === values.category)) {
      toast({ variant: 'destructive', title: 'Budget Exists', description: `A budget for "${values.category}" already exists.` });
      return;
    }
    
    const budgetData = {
        userId: user.uid,
        category: values.category,
        amount: values.amount,
        spent: isEditMode ? budget.spent : 0,
    };
    
    if (isEditMode && budget?.id) {
        const budgetDocRef = doc(firestore, `users/${user.uid}/budgets`, budget.id);
        setDocumentNonBlocking(budgetDocRef, budgetData, { merge: true });
    } else {
        const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
        addDocumentNonBlocking(budgetsCollection, budgetData);
    }
    
    toast({
      title: isEditMode ? 'Budget Updated' : 'Budget Added',
      description: `Successfully ${isEditMode ? 'updated' : 'added'} the "${values.category}" budget.`,
    });
    setOpen(false);
  };

  const trigger = controlledOpen === undefined ? <DialogTrigger asChild>{children}</DialogTrigger> : children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Adjust Budget' : 'Add New Budget'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update the amount for your ${budget.category} budget.` : 'Set a spending limit for a new category.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Budget'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
