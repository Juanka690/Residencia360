"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Algo salio mal</p>
      <h1 className="text-2xl font-semibold">Tuvimos un problema procesando la solicitud.</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Volvimos a registrar el evento en auditoria. Puedes reintentar la operacion o regresar al panel principal.
      </p>
      {error.digest ? (
        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">ref {error.digest}</code>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
