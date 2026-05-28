"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createParkingSpotAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  label: z.string().min(1),
  type: z.enum(["VISITOR"]).default("VISITOR"),
  isActive: z.coerce.boolean().default(true),
});

type Values = z.input<typeof schema>;

export function ParkingSpotForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", type: "VISITOR", isActive: true },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createParkingSpotAction({
        label: values.label,
        type: "VISITOR",
        isActive: Boolean(values.isActive),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), label: "" });
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Etiqueta</Label>
        <Input {...form.register("label")} placeholder="V-13" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isActive")} />
        Activo
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear cupo"}
      </Button>
    </form>
  );
}
