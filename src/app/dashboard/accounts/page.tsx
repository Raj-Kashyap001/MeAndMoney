import { PlusCircle, Landmark, CreditCard, Wallet } from 'lucide-react';
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
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockAccounts } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const AccountIcon = ({ type }: { type: 'bank' | 'card' | 'cash' }) => {
  const icons = {
    bank: <Landmark className="h-6 w-6 text-muted-foreground" />,
    card: <CreditCard className="h-6 w-6 text-muted-foreground" />,
    cash: <Wallet className="h-6 w-6 text-muted-foreground" />,
  };
  return <div className="p-2 bg-muted rounded-md">{icons[type]}</div>;
};

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" description="Manage your connected accounts.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Your Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAccounts.map((account) => (
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
                    {formatCurrency(account.balance)}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
