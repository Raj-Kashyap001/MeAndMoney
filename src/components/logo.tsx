import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
      >
        <circle cx="16" cy="16" r="16" fill="#EBF0FC" />
        <path
          d="M8 18L12.5 13L16.5 17L21 13L25 18"
          stroke="#48EA98"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-semibold">MeAndMoney</span>
    </div>
  );
}
