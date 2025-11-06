
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
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
import type { Goal, SavingStrategy } from '@/lib/types';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const goalSchema = z.object({
  name: z.string().min(2, { message: 'Goal name must be at least 2 characters.' }),
  targetAmount: z.coerce.number().positive({ message: 'Target amount must be positive.' }),
  currentAmount: z.coerce.number().min(0, { message: 'Current amount cannot be negative.' }),
  savingStrategy: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  periodicContribution: z.coerce.number().positive({ message: 'Contribution must be positive.' })
}).refine(data => data.currentAmount <= data.targetAmount, {
    message: "Current amount cannot be greater than the target amount.",
    path: ["currentAmount"],
});


type AddGoalDialogProps = {
  children: React.ReactNode;
  goal?: Goal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddGoalDialog({ children, goal, open: controlledOpen, onOpenChange: setControlledOpen }: AddGoalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!goal;
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        savingStrategy: 'monthly',
        periodicContribution: 0,
    }
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        form.reset({
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          savingStrategy: goal.savingStrategy as SavingStrategy,
          periodicContribution: goal.periodicContribution,
        });
      } else {
        form.reset({
          name: '',
          targetAmount: 0,
          currentAmount: 0,
          savingStrategy: 'monthly',
          periodicContribution: 0,
        });
      }
    }
  }, [goal, open, form]);

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    
    setIsSubmitting(true);
    
    const goalData = {
      ...values,
      userId: user.uid,
    };

    try {
        if (isEditMode && goal?.id) {
            const goalDocRef = doc(firestore, `users/${user.uid}/goals`, goal.id);
            setDocumentNonBlocking(goalDocRef, goalData, { merge: true });
        } else {
            const goalsCollection = collection(firestore, `users/${user.uid}/goals`);
            const goalRef = await addDocumentNonBlocking(goalsCollection, goalData);

            const savingsCollection = collection(firestore, `users/${user.uid}/budgets`);
            const savingData = {
                userId: user.uid,
                category: `Goal: ${values.name}`,
                amount: values.periodicContribution,
                spent: 0,
                isGoal: true,
                goalId: goalRef.id
            };
            addDocumentNonBlocking(savingsCollection, savingData);
        }
        
        toast({
        title: isEditMode ? 'Goal Updated' : 'Goal Added',
        description: `Successfully ${isEditMode ? 'updated' : 'added'} the "${values.name}" goal. A new saving plan has been created.`,
        });
        setOpen(false);
    } catch (e) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'There was an error saving your goal.'
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const trigger = controlledOpen === undefined ? <DialogTrigger asChild>{children}</DialogTrigger> : children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Adjust Goal' : 'Add New Goal'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update your financial goal.' : 'Set a new financial goal to work towards.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Graphics Card" {...field} disabled={isEditMode} />
                  </FormControl>
                  {isEditMode && <FormMessage>Goal name cannot be changed after creation.</FormMessage>}
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="savingStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saving Strategy</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodicContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Add Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
