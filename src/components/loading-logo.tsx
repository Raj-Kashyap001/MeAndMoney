
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="animate-pulse-fade">
            <Logo />
        </div>
        <p className="text-sm text-muted-foreground">Loading your financial dashboard...</p>
    </div>
  );
}
