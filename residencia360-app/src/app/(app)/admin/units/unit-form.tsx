"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createUnitAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  towerId: z.string().min(1),
  number: z.string().min(1),
  floor: z.coerce.number().min(1),
  apartmentCode: z.string().min(1),
});

type Values = z.input<typeof schema>;

export function UnitForm({ towers }: { towers: { id: string; name: string; code: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { towerId: towers[0]?.id ?? "", number: "", floor: "1", apartmentCode: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createUnitAction({ ...values, floor: Number(values.floor) });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset({ ...form.getValues(), number: "", apartmentCode: "" });
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Torre</Label>
        <Select defaultValue={towers[0]?.id} onValueChange={(value) => form.setValue("towerId", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {towers.map((tower) => (
              <SelectItem key={tower.id} value={tower.id}>
                {tower.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Piso</Label>
          <Input type="number" min={1} {...form.register("floor")} />
        </div>
        <div className="space-y-2">
          <Label>Numero</Label>
          <Input {...form.register("number")} placeholder="101" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Codigo</Label>
        <Input {...form.register("apartmentCode")} placeholder="T1-101" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear unidad"}
      </Button>
    </form>
  );
}
