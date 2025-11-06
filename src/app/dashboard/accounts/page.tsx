
'use client';

import { useState } from 'react';
import { PlusCircle, Landmark, CreditCard, Wallet, MoreHorizontal, Pencil, ArrowRightLeft, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { AddAccountDialog } from '@/components/add-account-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Account } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';
import { useToast } from '@/hooks/use-toast';


const AccountIcon = ({ type }: { type: 'bank' | 'card' | 'cash' }) => {
  const icons = {
    bank: <Landmark className="h-6 w-6 text-muted-foreground" />,
    card: <CreditCard className="h-6 w-6 text-muted-foreground" />,
    cash: <Wallet className="h-6 w-6 text-muted-foreground" />,
  };
  return <div className="p-2 bg-muted rounded-md">{icons[type]}</div>;
};

export default function AccountsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const accountsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [firestore, user]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);
  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) ?? 0;

  const handleEdit = (account: Account) => {
    setAccountToEdit(account);
    setIsAddAccountOpen(true);
  };
  
  const handleAddNew = () => {
    setAccountToEdit(undefined);
    setIsAddAccountOpen(true);
  };

  const handleDelete = (account: Account) => {
    if (!user) return;
    const accountDocRef = doc(firestore, `users/${user.uid}/accounts`, account.id);
    deleteDocumentNonBlocking(accountDocRef);
    toast({
      title: "Source Deleted",
      description: `The "${account.name}" source has been deleted.`,
    });
    setAccountToDelete(null);
  };

  const StatCard = ({ title, value, icon: Icon, description, isLoading: isLoadingStat }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoadingStat ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageHeader title="Money Sources" description="Manage where your money is stored.">
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Source
        </Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance, currency)} icon={Wallet} description="Across all your sources" isLoading={isLoading} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Money Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  <TableRow>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                </>
              )}
              {!isLoading && accounts && accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <AccountIcon type={account.type} />
                      <div>
                        <div className="font-medium">{account.name}</div>
                        {account.bankName && <div className="text-sm text-muted-foreground">{account.bankName}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{account.type}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-mono", account.balance < 0 ? 'text-destructive' : 'text-emerald-600')}>
                    {formatCurrency(account.balance, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>                      
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Funds
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setAccountToDelete(account)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && (!accounts || accounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No sources found. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddAccountDialog 
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        account={accountToEdit}
      >
        <span />
      </AddAccountDialog>

      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your money source and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => accountToDelete && handleDelete(accountToDelete)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
