
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Goal, SavingStrategy } from '@/lib/types';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { add, differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears, format } from 'date-fns';

const goalSchema = z.object({
  name: z.string().min(2, { message: 'Goal name must be at least 2 characters.' }),
  targetAmount: z.coerce.number().positive({ message: 'Target amount must be positive.' }),
  currentAmount: z.coerce.number().min(0, { message: 'Current amount cannot be negative.' }),
  targetDate: z.date({ required_error: 'A target date is required.'}),
  savingStrategy: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  periodicContribution: z.coerce.number().positive({ message: 'Contribution must be positive.' })
}).refine(data => data.currentAmount <= data.targetAmount, {
    message: "Current amount cannot be greater than the target amount.",
    path: ["currentAmount"],
}).refine(data => data.targetDate > new Date(), {
    message: "Target date must be in the future.",
    path: ["targetDate"],
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
        targetDate: add(new Date(), { years: 1 }),
        savingStrategy: 'monthly',
        periodicContribution: 0,
    }
  });
  
  const targetAmount = form.watch('targetAmount');
  const currentAmount = form.watch('currentAmount');
  const targetDate = form.watch('targetDate');
  const savingStrategy = form.watch('savingStrategy');

  useEffect(() => {
    if (targetAmount && targetDate && savingStrategy) {
      const remainingAmount = targetAmount - (currentAmount || 0);
      if (remainingAmount <= 0) {
        form.setValue('periodicContribution', 0);
        return;
      }
      
      const now = new Date();
      let periods = 0;

      switch(savingStrategy) {
        case 'daily': periods = differenceInDays(targetDate, now); break;
        case 'weekly': periods = differenceInWeeks(targetDate, now); break;
        case 'monthly': periods = differenceInMonths(targetDate, now); break;
        case 'quarterly': periods = differenceInQuarters(targetDate, now); break;
        case 'yearly': periods = differenceInYears(targetDate, now); break;
      }

      if (periods > 0) {
        const contribution = remainingAmount / periods;
        form.setValue('periodicContribution', parseFloat(contribution.toFixed(2)));
      } else {
        form.setValue('periodicContribution', remainingAmount);
      }
    }
  }, [targetAmount, currentAmount, targetDate, savingStrategy, form]);

  useEffect(() => {
    if (open) {
      if (isEditMode && goal) {
        form.reset({
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: new Date(goal.targetDate),
          savingStrategy: goal.savingStrategy as SavingStrategy,
          periodicContribution: goal.periodicContribution,
        });
      } else {
        form.reset({
          name: '',
          targetAmount: 0,
          currentAmount: 0,
          targetDate: add(new Date(), { years: 1 }),
          savingStrategy: 'monthly',
          periodicContribution: 0,
        });
      }
    }
  }, [goal, open, form, isEditMode]);

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    
    setIsSubmitting(true);
    
    const goalData = {
      ...values,
      userId: user.uid,
      targetDate: values.targetDate.toISOString(),
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
      <DialogContent className="sm:max-w-[520px]">
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
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Target Date</FormLabel>
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
                              {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
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
                            disabled={(date) => date <= new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            </div>
            <div>
               <FormField
                control={form.control}
                name="periodicContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Contribution</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500.00" {...field} readOnly className="bg-muted focus-visible:ring-0 focus-visible:ring-offset-0" />
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
