"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createVisitAction, updateVisitStatusAction } from "@/server/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  fullName: z.string().min(3),
  document: z.string().min(5),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  reason: z.string().min(4),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
  gateType: z.enum(["PEDESTRIAN", "VEHICULAR"]),
  apartmentId: z.string().min(1),
  residentId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function VisitForm({
  actorId,
  residentId,
  apartmentId,
}: {
  actorId: string;
  residentId: string;
  apartmentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      document: "",
      phone: "",
      vehiclePlate: "",
      reason: "",
      scheduledStart: "",
      scheduledEnd: "",
      gateType: "PEDESTRIAN",
      apartmentId,
      residentId,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createVisitAction(values, actorId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      form.reset({ ...form.getValues(), fullName: "", document: "", phone: "", vehiclePlate: "", reason: "", scheduledStart: "", scheduledEnd: "" });
      toast.success(result.message);
    });
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Nombre del visitante</Label>
        <Input {...form.register("fullName")} />
      </div>
      <div className="space-y-2">
        <Label>Documento</Label>
        <Input {...form.register("document")} />
      </div>
      <div className="space-y-2">
        <Label>Telefono</Label>
        <Input {...form.register("phone")} />
      </div>
      <div className="space-y-2">
        <Label>Placa opcional</Label>
        <Input {...form.register("vehiclePlate")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Motivo</Label>
        <Input {...form.register("reason")} />
      </div>
      <div className="space-y-2">
        <Label>Ingreso</Label>
        <Input type="datetime-local" {...form.register("scheduledStart")} />
      </div>
      <div className="space-y-2">
        <Label>Salida</Label>
        <Input type="datetime-local" {...form.register("scheduledEnd")} />
      </div>
      <div className="space-y-2">
        <Label>Tipo de porteria</Label>
        <Select defaultValue="PEDESTRIAN" onValueChange={(value) => form.setValue("gateType", value as "PEDESTRIAN" | "VEHICULAR")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PEDESTRIAN">Peatonal</SelectItem>
            <SelectItem value="VEHICULAR">Vehicular</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Registrar visita"}
        </Button>
      </div>
    </form>
  );
}

export function VisitStatusActions({
  visitId,
  actorId,
  currentStatus,
}: {
  visitId: string;
  actorId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  const changeStatus = (status: "APPROVED" | "CANCELLED" | "REJECTED") => {
    startTransition(async () => {
      const result = await updateVisitStatusAction(visitId, status, actorId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  };

  if (currentStatus !== "PRE_REGISTERED") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={() => changeStatus("APPROVED")}>
        Aprobar
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => changeStatus("CANCELLED")}>
        Cancelar
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => changeStatus("REJECTED")}>
        Rechazar
      </Button>
    </div>
  );
}
