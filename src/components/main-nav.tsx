'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PiggyBank,
  Lightbulb,
  Settings,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Wallet },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/dashboard/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/insights', label: 'Insights', icon: Lightbulb },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
    <nav className="flex flex-col items-start gap-2 px-2 text-sm font-medium lg:px-4">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Tooltip key={href}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname === href && 'bg-muted text-primary',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="h-4 w-4" />
              {!isCollapsed && label}
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </nav>
    </TooltipProvider>
  );
}
