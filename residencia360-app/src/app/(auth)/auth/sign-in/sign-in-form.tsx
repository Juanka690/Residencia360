"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(8, "La contrasena es obligatoria."),
});

type FormValues = z.infer<typeof schema>;

const DEMO_USERS = [
  { role: "Administrador", email: "admin@residencia360.local" },
  { role: "Vigilante", email: "vigilante@residencia360.local" },
  { role: "Residente", email: "residente1@residencia360.local" },
  { role: "Consejo", email: "consejo@residencia360.local" },
];

export function SignInForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await signIn("credentials", {
          ...values,
          callbackUrl,
          redirect: false,
        });

        if (response?.error) {
          const message =
            response.error === "AUTH_SERVICE_UNAVAILABLE"
              ? "El servicio de autenticacion no puede conectarse a la base de datos."
              : response.error === "ACCOUNT_LOCKED"
                ? "La cuenta esta bloqueada temporalmente por 15 minutos tras varios intentos fallidos."
              : "Credenciales invalidas.";

          setError(message);
          toast.error(message);
          return;
        }

        if (!response?.ok || !response.url) {
          const message = "No fue posible completar el inicio de sesion.";
          setError(message);
          toast.error(message);
          return;
        }

        toast.success("Sesion iniciada.");
        router.push(response.url);
        router.refresh();
      } catch (error) {
        console.error("SIGN_IN_REQUEST_ERROR", error);
        const message = "El servicio de autenticacion no esta disponible.";
        setError(message);
        toast.error(message);
      }
    });
  });

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/85 shadow-glow backdrop-blur">
      <CardHeader>
        <CardTitle>Acceso seguro</CardTitle>
        <CardDescription>Ingresa con tu correo institucional o de residente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-xs text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Ingresando..." : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/auth/forgot-password" className="text-primary hover:underline">
            Recuperar contrasena
          </Link>
          <span className="text-muted-foreground">Demo: Residencia360!</span>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-900">Accesos demo por rol</p>
          <div className="mt-3 space-y-2 text-slate-600">
            {DEMO_USERS.map((user) => (
              <p key={user.email}>
                <span className="font-medium text-slate-900">{user.role}:</span> {user.email}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
