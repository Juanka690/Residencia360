import { Brand } from "@/components/brand";
import { SignInForm } from "@/app/(auth)/auth/sign-in/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/60 bg-white/40 p-6 shadow-glow backdrop-blur lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden rounded-[1.5rem] bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Brand className="[&_*]:text-white" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Acceso por roles</p>
            <h1 className="mt-4 text-4xl font-semibold">Un solo portal para residentes, administracion y porteria.</h1>
            <p className="mt-4 text-slate-300">Controla visitas, reservas, PQRS, anuncios y cartera con trazabilidad de punta a punta.</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 lg:p-10">
          <SignInForm callbackUrl={params?.callbackUrl} />
        </div>
      </div>
    </main>
  );
}
