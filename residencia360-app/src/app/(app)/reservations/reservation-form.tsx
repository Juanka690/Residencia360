"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createReservationAction, reviewReservationAction } from "@/server/actions/reservations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  areaId: z.string().min(1),
  apartmentId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  attendees: z.coerce.number().min(1),
  purpose: z.string().min(6),
});

type FormValues = z.input<typeof schema>;

export function ReservationForm({
  residentId,
  apartmentId,
  areas,
}: {
  residentId: string;
  apartmentId: string;
  areas: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      areaId: areas[0]?.id ?? "",
      apartmentId,
      startAt: "",
      endAt: "",
      attendees: "1",
      purpose: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createReservationAction(
        {
          ...values,
          attendees: Number(values.attendees),
        },
        residentId,
      );
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), startAt: "", endAt: "", attendees: "1", purpose: "" });
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Zona comun</Label>
        <Select defaultValue={areas[0]?.id} onValueChange={(value) => form.setValue("areaId", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {areas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Asistentes</Label>
        <Input type="number" min={1} {...form.register("attendees")} />
      </div>
      <div className="space-y-2">
        <Label>Inicio</Label>
        <Input type="datetime-local" {...form.register("startAt")} />
      </div>
      <div className="space-y-2">
        <Label>Fin</Label>
        <Input type="datetime-local" {...form.register("endAt")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Motivo</Label>
        <Input {...form.register("purpose")} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Solicitar reserva"}
        </Button>
      </div>
    </form>
  );
}

export function ReservationReviewActions({ reservationId, actorId }: { reservationId: string; actorId: string }) {
  const [isPending, startTransition] = useTransition();

  const run = (status: "APPROVED" | "REJECTED") =>
    startTransition(async () => {
      const result = await reviewReservationAction(reservationId, actorId, status, status === "REJECTED" ? "No cumple validacion administrativa." : undefined);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run("APPROVED")} disabled={isPending}>
        Aprobar
      </Button>
      <Button size="sm" variant="destructive" onClick={() => run("REJECTED")} disabled={isPending}>
        Rechazar
      </Button>
    </div>
  );
}
