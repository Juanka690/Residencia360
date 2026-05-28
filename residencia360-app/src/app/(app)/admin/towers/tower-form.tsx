"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createTowerAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(8),
});

type Values = z.infer<typeof schema>;

export function TowerForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createTowerAction(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      form.reset();
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input {...form.register("name")} placeholder="Torre 4" />
      </div>
      <div className="space-y-2">
        <Label>Codigo</Label>
        <Input {...form.register("code")} placeholder="T4" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear torre"}
      </Button>
    </form>
  );
}
