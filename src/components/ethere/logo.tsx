import { cn } from "@/lib/utils";

export function EthereLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="1" y="1" width="20" height="20" rx="6" fill="currentColor" />
        <path
          d="M7 8h8M7 11h6M7 14h8"
          stroke="var(--background)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Ethere</span>
    </div>
  );
}
