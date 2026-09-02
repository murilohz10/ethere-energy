import { cn } from "@/lib/utils";
import logoAsset from "@/assets/ethere-logo.png.asset.json";

export function EthereLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src={logoAsset.url}
        alt="Ethere Energy"
        width={32}
        height={22}
        className="h-[22px] w-auto shrink-0"
        loading="eager"
        decoding="async"
      />
      <span className="text-[15px] font-semibold tracking-tight">Ethere</span>
    </div>
  );
}
