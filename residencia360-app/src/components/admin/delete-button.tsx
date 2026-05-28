"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Action = () => Promise<{ success: boolean; message: string }>;

export function DeleteButton({ action, label = "Eliminar", confirmText }: { action: Action; label?: string; confirmText?: string }) {
  const [isPending, startTransition] = useTransition();

  const run = () => {
    if (confirmText && !confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  };

  return (
    <Button size="sm" variant="destructive" disabled={isPending} onClick={run}>
      {isPending ? "Procesando..." : label}
    </Button>
  );
}
