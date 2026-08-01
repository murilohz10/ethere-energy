import { cn } from "@/lib/utils";

export function EthereLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id="ethere-logo-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1D4E89" />
            <stop offset="60%" stopColor="#3FA9F5" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#ethere-logo-g)" />
        <path
          d="M7.5 9h9M7.5 12h6.5M7.5 15h9"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">Ethere</span>
    </div>
  );
}
