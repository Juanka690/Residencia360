"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createProviderCompanyAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2),
  taxId: z.string().optional(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

type Values = z.input<typeof schema>;

export function ProviderCompanyForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      taxId: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      isActive: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createProviderCompanyAction({
        ...values,
        taxId: values.taxId || null,
        contactEmail: values.contactEmail || null,
        isActive: Boolean(values.isActive),
      });
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
        <Input {...form.register("name")} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>NIT</Label>
          <Input {...form.register("taxId")} />
        </div>
        <div className="space-y-2">
          <Label>Contacto</Label>
          <Input {...form.register("contactName")} />
        </div>
        <div className="space-y-2">
          <Label>Telefono</Label>
          <Input {...form.register("contactPhone")} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...form.register("contactEmail")} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isActive")} />
        Activo
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear empresa"}
      </Button>
    </form>
  );
}
