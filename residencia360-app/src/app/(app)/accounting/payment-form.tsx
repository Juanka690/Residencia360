"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { reviewPaymentSupportAction, submitPaymentSupportAction } from "@/server/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload, type UploadedFile } from "@/components/file-upload";
import { BUCKETS } from "@/lib/supabase-storage";

const submitSchema = z.object({
  apartmentId: z.string().min(1),
  reference: z.string().min(4),
  amount: z.coerce.number().min(1),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
});

type SubmitValues = z.input<typeof submitSchema>;

export function PaymentSupportForm({ apartmentId, actorId }: { apartmentId: string; actorId: string }) {
  const [support, setSupport] = useState<UploadedFile | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<SubmitValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      apartmentId,
      reference: "",
      amount: "0",
      paidAt: "",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!support) {
      toast.error("Debes adjuntar el soporte del pago.");
      return;
    }
    startTransition(async () => {
      const result = await submitPaymentSupportAction(
        {
          ...values,
          amount: Number(values.amount),
          fileName: support.fileName,
          fileUrl: support.publicUrl ?? support.path,
        },
        actorId,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSupport(null);
      form.reset({ ...form.getValues(), reference: "", amount: 0, paidAt: "", notes: "" });
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
        <Label>Soporte</Label>
        <FileUpload
          bucket={BUCKETS.PAYMENTS}
          pathPrefix={`apartment-${apartmentId}`}
          buttonLabel="Adjuntar comprobante"
          onUploaded={setSupport}
          onCleared={() => setSupport(null)}
        />
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
