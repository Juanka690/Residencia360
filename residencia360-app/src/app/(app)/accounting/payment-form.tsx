"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { reviewPaymentSupportAction, submitPaymentSupportAction } from "@/server/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const submitSchema = z.object({
  apartmentId: z.string().min(1),
  reference: z.string().min(4),
  amount: z.coerce.number().min(1),
  paidAt: z.string().min(1),
  fileName: z.string().min(3),
  notes: z.string().optional(),
});

type SubmitValues = z.input<typeof submitSchema>;

export function PaymentSupportForm({ apartmentId, actorId }: { apartmentId: string; actorId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SubmitValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      apartmentId,
      reference: "",
      amount: "0",
      paidAt: "",
      fileName: "",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitPaymentSupportAction(
        {
          ...values,
          amount: Number(values.amount),
        },
        actorId,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), reference: "", amount: 0, paidAt: "", fileName: "", notes: "" });
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Referencia</Label>
        <Input {...form.register("reference")} />
      </div>
      <div className="space-y-2">
        <Label>Monto</Label>
        <Input type="number" {...form.register("amount")} />
      </div>
      <div className="space-y-2">
        <Label>Fecha de pago</Label>
        <Input type="datetime-local" {...form.register("paidAt")} />
      </div>
      <div className="space-y-2">
        <Label>Nombre del soporte</Label>
        <Input placeholder="soporte-transferencia.pdf" {...form.register("fileName")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Notas</Label>
        <Input {...form.register("notes")} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar soporte"}
        </Button>
      </div>
    </form>
  );
}

export function PaymentReviewActions({ paymentId, actorId }: { paymentId: string; actorId: string }) {
  const [isPending, startTransition] = useTransition();
  const run = (ok: boolean) =>
    startTransition(async () => {
      const result = await reviewPaymentSupportAction(
        paymentId,
        actorId,
        ok ? "APPROVED" : "REJECTED",
        ok ? "APPLIED" : "REJECTED",
        ok ? "Aplicado a cartera." : "Soporte inconsistente.",
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run(true)} disabled={isPending}>
        Aprobar
      </Button>
      <Button size="sm" variant="destructive" onClick={() => run(false)} disabled={isPending}>
        Rechazar
      </Button>
    </div>
  );
}
