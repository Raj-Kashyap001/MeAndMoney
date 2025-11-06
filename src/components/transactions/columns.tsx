
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useCurrency } from '@/components/currency-provider';

// This is a workaround because we can't use hooks in the column definition directly
// We'll pass the currency to the cell function via meta property on the table
// See src/components/transactions/data-table.tsx

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => format(new Date(row.getValue('date')), 'MMM d, yyyy'),
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('category')}</Badge>,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row, table }) => {
      const amount = parseFloat(row.getValue('amount'));
      const isExpense = row.original.type === 'expense';
      const { currency } = table.options.meta as { currency: string };
      
      return (
        <div className={cn('text-right font-medium', isExpense ? 'text-destructive' : 'text-green-600')}>
          {formatCurrency(amount, currency)}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(transaction.id)}
              >
                Copy transaction ID
              </DropdownMenuItem>
              <DropdownMenuItem>Edit transaction</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete transaction</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

    