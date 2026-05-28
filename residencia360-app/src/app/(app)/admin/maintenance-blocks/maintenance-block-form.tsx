"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createMaintenanceBlockAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  areaId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  reason: z.string().min(4),
});

type Values = z.input<typeof schema>;

export function MaintenanceBlockForm({ areas }: { areas: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { areaId: areas[0]?.id ?? "", startAt: "", endAt: "", reason: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createMaintenanceBlockAction(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), startAt: "", endAt: "", reason: "" });
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Zona</Label>
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
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Inicio</Label>
          <Input type="datetime-local" {...form.register("startAt")} />
        </div>
        <div className="space-y-2">
          <Label>Fin</Label>
          <Input type="datetime-local" {...form.register("endAt")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Motivo</Label>
        <Textarea {...form.register("reason")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear bloqueo"}
      </Button>
    </form>
  );
}
