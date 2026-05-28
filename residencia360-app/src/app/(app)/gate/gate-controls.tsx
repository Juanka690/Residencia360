"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { registerVisitEgressAction, registerVisitIngressAction } from "@/server/actions/visits";
import { Button } from "@/components/ui/button";

export function GateControls({
  visitId,
  guardId,
  status,
}: {
  visitId: string;
  guardId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  const run = (type: "in" | "out") =>
    startTransition(async () => {
      const result =
        type === "in"
          ? await registerVisitIngressAction(visitId, guardId)
          : await registerVisitEgressAction(visitId, guardId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setCurrentStatus(type === "in" ? "CHECKED_IN" : "COMPLETED");
      toast.success(result.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending || currentStatus !== "APPROVED"} onClick={() => run("in")}>
        Registrar ingreso
      </Button>
      <Button size="sm" variant="outline" disabled={isPending || currentStatus !== "CHECKED_IN"} onClick={() => run("out")}>
        Registrar salida
      </Button>
    </div>
  );
}
