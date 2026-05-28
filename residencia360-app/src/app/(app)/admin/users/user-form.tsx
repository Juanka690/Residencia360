"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createUserAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = ["RESIDENT", "GUARD", "ADMIN", "BOARD", "CONTRACTOR"] as const;
const STATUSES = ["ACTIVE", "INVITED", "SUSPENDED"] as const;

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  document: z.string().optional(),
  role: z.enum(ROLES),
  status: z.enum(STATUSES).default("ACTIVE"),
  towerId: z.string().optional(),
  apartmentId: z.string().optional(),
});

type Values = z.input<typeof schema>;

export function UserForm({
  towers,
  units,
}: {
  towers: { id: string; name: string }[];
  units: { id: string; apartmentCode: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [resetToken, setResetToken] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      document: "",
      role: "RESIDENT",
      status: "INVITED",
      towerId: "",
      apartmentId: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createUserAction({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        status: values.status || "ACTIVE",
        towerId: values.towerId || null,
        apartmentId: values.apartmentId || null,
        phone: values.phone || null,
        document: values.document || null,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setResetToken(result.data?.resetToken ?? null);
      form.reset({ ...form.getValues(), email: "", firstName: "", lastName: "", phone: "", document: "" });
    });
  });

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" {...form.register("email")} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombres</Label>
          <Input {...form.register("firstName")} />
        </div>
        <div className="space-y-2">
          <Label>Apellidos</Label>
          <Input {...form.register("lastName")} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Telefono</Label>
          <Input {...form.register("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Documento</Label>
          <Input {...form.register("document")} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select defaultValue="RESIDENT" onValueChange={(value) => form.setValue("role", value as Values["role"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado inicial</Label>
          <Select defaultValue="INVITED" onValueChange={(value) => form.setValue("status", value as Values["status"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Torre (opcional)</Label>
          <Select onValueChange={(value) => form.setValue("towerId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
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
        <div className="space-y-2">
          <Label>Unidad (opcional)</Label>
          <Select onValueChange={(value) => form.setValue("apartmentId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              {units.slice(0, 200).map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.apartmentCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear usuario"}
      </Button>
      {resetToken ? (
        <div className="rounded-md border border-dashed border-emerald-400 bg-emerald-50 p-3 text-xs">
          <p className="font-semibold text-emerald-700">Token de invitacion generado</p>
          <p className="break-all text-emerald-700">{resetToken}</p>
          <p className="mt-1 text-emerald-600">
            Comparte el enlace /auth/reset-password/{resetToken} con el usuario para establecer su clave.
          </p>
        </div>
      ) : null}
    </form>
  );
}
