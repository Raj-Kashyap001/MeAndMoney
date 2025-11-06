
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
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Account } from '@/lib/types';


const accountSchema = z.object({
  name: z.string().min(2, { message: 'Source name must be at least 2 characters.' }),
  type: z.enum(['bank', 'card', 'cash']),
  balance: z.coerce.number(),
  bankName: z.string().optional(),
});

type AddAccountDialogProps = {
  children: React.ReactNode;
  account?: Account;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};


export function AddAccountDialog({ children, account, open: controlledOpen, onOpenChange: setControlledOpen }: AddAccountDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const isEditMode = !!account;

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;


  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && account) {
        form.reset({
          name: account.name,
          type: account.type,
          balance: account.balance,
          bankName: account.bankName || '',
        });
      } else {
        form.reset({
          name: '',
          type: 'bank',
          balance: 0,
          bankName: '',
        });
      }
    }
  }, [account, open, form, isEditMode]);

  const onSubmit = (values: z.infer<typeof accountSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    
    if (isEditMode && account?.id) {
      const accountDocRef = doc(firestore, `users/${user.uid}/accounts`, account.id);
      setDocumentNonBlocking(accountDocRef, { ...values, userId: user.uid }, { merge: true });
       toast({
        title: 'Source Updated',
        description: `Successfully updated the "${values.name}" source.`,
      });
    } else {
      const accountsCollection = collection(firestore, `users/${user.uid}/accounts`);
      addDocumentNonBlocking(accountsCollection, {
        ...values,
        userId: user.uid,
      });
      toast({
        title: 'Source Added',
        description: `Successfully added the "${values.name}" source.`,
      });
    }

    setOpen(false);
  };

  const trigger = controlledOpen === undefined ? <DialogTrigger asChild>{children}</DialogTrigger> : children;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Source' : 'Add New Source'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update the details for your "${account.name}" source.` : 'Enter the details for your new money source.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Wallet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chase Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Source'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
