import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

import { APP_NAME, RESIDENTIAL_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
        {compact ? <Building2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
      </div>
      {!compact ? (
        <div>
          <p className="text-base font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">{RESIDENTIAL_NAME}</p>
        </div>
      ) : null}
    </Link>
  );
}
