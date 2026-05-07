import { cn } from "@/lib/utils";

/**
 * Reserved space for an AdMob banner. When you wrap this web app with
 * Capacitor / Cordova for Android, mount the AdMob banner inside the
 * div with id `admob-banner-slot`. CSS keeps the layout stable.
 *
 * Web fallback: shows a subtle "Advertisement" placeholder so the design
 * never collapses if no ad is loaded.
 */
export function AdSlot({ className, position = "bottom" }: { className?: string; position?: "top" | "bottom" | "inline" }) {
  return (
    <div
      id={`admob-banner-slot-${position}`}
      data-admob-slot={position}
      className={cn(
        "w-full flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-widest",
        "h-[60px]",
        className,
      )}
    >
      Advertisement
    </div>
  );
}
