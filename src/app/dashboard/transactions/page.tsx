import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/transactions/data-table';
import { columns } from '@/components/transactions/columns';
import { mockTransactions } from '@/lib/data';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="View and manage all your financial transactions."
      >
        <AddTransactionDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </AddTransactionDialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockTransactions} />
        </CardContent>
      </Card>
    </>
  );
}
