"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createCommonAreaAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(4),
  capacity: z.coerce.number().min(1),
  color: z.string().default("#1d4ed8"),
  minimumAdvanceHours: z.coerce.number().min(0).default(24),
  maxActiveReservationsWeekly: z.coerce.number().min(1).default(1),
  blockIfInArrears: z.coerce.boolean().default(true),
});

type Values = z.input<typeof schema>;

export function CommonAreaForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      capacity: "1",
      color: "#1d4ed8",
      minimumAdvanceHours: "24",
      maxActiveReservationsWeekly: "1",
      blockIfInArrears: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCommonAreaAction({
        name: values.name,
        description: values.description,
        color: values.color || "#1d4ed8",
        capacity: Number(values.capacity),
        minimumAdvanceHours: Number(values.minimumAdvanceHours),
        maxActiveReservationsWeekly: Number(values.maxActiveReservationsWeekly),
        blockIfInArrears: Boolean(values.blockIfInArrears),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), name: "", description: "" });
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label>Descripcion</Label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Capacidad</Label>
          <Input type="number" min={1} {...form.register("capacity")} />
        </div>
        <div className="space-y-2">
          <Label>Color</Label>
          <Input type="color" {...form.register("color")} />
        </div>
        <div className="space-y-2">
          <Label>Anticipacion min. (horas)</Label>
          <Input type="number" min={0} {...form.register("minimumAdvanceHours")} />
        </div>
        <div className="space-y-2">
          <Label>Max reservas semanal</Label>
          <Input type="number" min={1} {...form.register("maxActiveReservationsWeekly")} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("blockIfInArrears")} />
        Bloquear si apartamento en mora (RN-08)
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear zona"}
      </Button>
    </form>
  );
}
