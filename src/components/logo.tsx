import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
      >
        <rect width="28" height="28" rx="8" fill="#48EA98" />
        <path
          d="M8 16L12.5 11L16.5 15L21 11L25 16"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-lg font-semibold">MeAndMoney<sup className="text-xs ml-1">v1.0</sup></span>
    </div>
  );
}
