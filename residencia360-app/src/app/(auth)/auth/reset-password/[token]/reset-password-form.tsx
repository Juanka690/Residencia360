"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetPassword } from "@/app/(auth)/auth/reset-password/[token]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  password: z.string().min(8, "Minimo 8 caracteres."),
});

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await resetPassword({ token, password: values.password });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/auth/sign-in");
    });
  });

  return (
    <Card className="w-full max-w-md border-white/70 bg-white/85 shadow-glow backdrop-blur">
      <CardHeader>
        <CardTitle>Nueva contrasena</CardTitle>
        <CardDescription>Actualiza el acceso y vuelve a iniciar sesion.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contrasena</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-xs text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "Actualizando..." : "Guardar nueva contrasena"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
