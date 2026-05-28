"use client";

import { UserStatus } from "@prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setUserStatusAction } from "@/server/actions/admin";

export function UserRowActions({ userId, status }: { userId: string; status: UserStatus }) {
  const [isPending, startTransition] = useTransition();

  const setStatus = (next: UserStatus) =>
    startTransition(async () => {
      const result = await setUserStatusAction(userId, next);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });

  return (
    <div className="flex justify-end gap-2">
      {status !== UserStatus.ACTIVE ? (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus(UserStatus.ACTIVE)}>
          Activar
        </Button>
      ) : null}
      {status !== UserStatus.SUSPENDED ? (
        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setStatus(UserStatus.SUSPENDED)}>
          Suspender
        </Button>
      ) : null}
    </div>
  );
}
