import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">La pagina que buscas no existe.</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Probablemente el enlace cambio, expiro o nunca existio. Vuelve al panel para retomar la operacion.
      </p>
      <Button asChild>
        <Link href="/dashboard">Ir al panel</Link>
      </Button>
    </div>
  );
}
