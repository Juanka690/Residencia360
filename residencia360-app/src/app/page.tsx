import Link from "next/link";
import { ArrowRight, BadgeCheck, BellRing, CalendarClock, CreditCard, ShieldCheck, Ticket, Users } from "lucide-react";

import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "Control de visitantes", description: "Pre-registro, aprobacion, QR y trazabilidad de ingreso y salida.", icon: Users },
  { title: "Porteria operativa", description: "Validacion por codigo, documento o QR para acceso vehicular y peatonal.", icon: ShieldCheck },
  { title: "PQRS con seguimiento", description: "Radicacion, SLA, historial interno y cierre con evidencia.", icon: Ticket },
  { title: "Reservas inteligentes", description: "Calendario, reglas por mora, anticipacion y mantenimiento.", icon: CalendarClock },
  { title: "Comunicados y alertas", description: "Anuncios segmentados por toda la unidad o por torre.", icon: BellRing },
  { title: "Cartera y pagos", description: "Estado de cuenta, soportes y validacion manual por administracion.", icon: CreditCard },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-residencia-hero">
      <section className="panel-grid px-6 py-6 lg:px-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-glow backdrop-blur xl:p-8">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <Brand />
            <div className="flex items-center gap-3">
              <Badge variant="outline">MVP universitario funcional</Badge>
              <Button asChild variant="outline">
                <Link href="/auth/sign-in">Ingresar</Link>
              </Button>
            </div>
          </header>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Badge className="rounded-full px-3 py-1 text-sm">Altos de Santa Clara · Medellin</Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Operacion residencial, seguridad y servicio en una sola plataforma.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Residencia360 centraliza visitas, porteria, PQRS, reservas, anuncios, cartera y reportes para una unidad residencial con 3 torres, 240 apartamentos y 2 porterias.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/auth/sign-in">
                    Entrar al sistema
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#modulos">Ver modulos</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["240", "apartamentos parametrizados"],
                  ["12+", "modulos listos para crecer"],
                  ["100%", "responsive y con roles"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-[2rem] border border-white/70 p-6">
              <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Operacion en vivo</p>
                  <Badge className="bg-emerald-500/15 text-emerald-200">Seguro</Badge>
                </div>
                <div className="mt-8 grid gap-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-300">Visitas aprobadas hoy</p>
                    <p className="mt-2 text-3xl font-semibold">18</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-sm text-slate-300">PQRS activas</p>
                      <p className="mt-2 text-2xl font-semibold">7</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-sm text-slate-300">Reservas pendientes</p>
                      <p className="mt-2 text-2xl font-semibold">4</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                    <p className="text-sm opacity-80">Bitacora activa</p>
                    <p className="mt-2 flex items-center gap-2 text-lg font-medium">
                      <BadgeCheck className="h-5 w-5" />
                      Auditoria de accesos y acciones sensibles habilitada
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Modulos principales</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Aplicativo web integral listo para operar</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-white/80 bg-white/90">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{feature.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
