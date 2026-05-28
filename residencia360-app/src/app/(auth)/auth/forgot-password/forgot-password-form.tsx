"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { requestPasswordReset } from "@/app/(auth)/auth/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Ingresa un correo valido."),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.token) {
        toast.info(`Enlace local: /auth/reset-password/${result.token}`);
      }
    });
  });

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/85 shadow-glow backdrop-blur">
      <CardHeader>
        <CardTitle>Recuperar contrasena</CardTitle>
        <CardDescription>Genera un enlace temporal para actualizar tu acceso localmente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Generando..." : "Generar enlace"}
          </Button>
        </form>
        <Link href="/auth/sign-in" className="block text-center text-sm text-primary hover:underline">
          Volver al inicio de sesion
        </Link>
      </CardContent>
    </Card>
  );
}
