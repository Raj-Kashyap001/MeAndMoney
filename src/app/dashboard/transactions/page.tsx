
'use client';
import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/transactions/data-table';
import { columns } from '@/components/transactions/columns';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('date', 'desc'));
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const handleAddNew = () => {
    setTransactionToEdit(undefined);
    setIsAddTransactionOpen(true);
  };
  
  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsAddTransactionOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
     if (!user) return;
    const transactionDocRef = doc(firestore, `users/${user.uid}/transactions`, transaction.id);
    deleteDocumentNonBlocking(transactionDocRef);
    toast({
      title: "Transaction Deleted",
      description: `The transaction "${transaction.description}" has been deleted.`,
    });
    setTransactionToDelete(null);
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        description="View and manage all your financial transactions."
      >
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={transactions ?? []} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={(transaction) => setTransactionToDelete(transaction)}
          />
        </CardContent>
      </Card>
      
      <AddTransactionDialog 
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        transaction={transactionToEdit}
      >
        <span />
      </AddTransactionDialog>

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => transactionToDelete && handleDelete(transactionToDelete)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
