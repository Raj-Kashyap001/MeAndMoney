
'use client';

import { PlusCircle, Landmark, CreditCard, Wallet, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { AddAccountDialog } from '@/components/add-account-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/components/currency-provider';

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

  const accountsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);

  return (
    <>
      <PageHeader title="Money Sources" description="Manage where your money is stored.">
        <AddAccountDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </AddAccountDialog>
      </PageHeader>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Transfer Funds</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
    </>
  );
}
