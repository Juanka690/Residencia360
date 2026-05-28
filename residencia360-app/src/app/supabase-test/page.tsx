import Link from "next/link";

import { createClient } from "@/utils/supabase/server";

type TodoRow = {
  id: string | number;
  name: string | null;
};

export default async function SupabaseTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("todos").select("id, name").limit(10);
  const todos = (data ?? []) as TodoRow[];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Supabase</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Conexion de prueba en Next.js</h1>
        <p className="text-sm leading-6 text-slate-600">
          Esta ruta usa el cliente SSR configurado en <code>src/utils/supabase/server.ts</code>.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Estado de autenticacion</h2>
        <p className="mt-3 text-sm text-slate-600">
          {user ? `Sesion detectada para ${user.email ?? user.id}.` : "No hay sesion activa en Supabase."}
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Consulta de ejemplo</h2>
        {error ? (
          <p className="mt-3 text-sm leading-6 text-amber-700">
            La conexion funciona, pero la tabla <code>todos</code> no esta lista o no es accesible: {error.message}
          </p>
        ) : todos.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {todos.map((todo) => (
              <li key={todo.id} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                {todo.name ?? "Sin nombre"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">La consulta no devolvio registros en la tabla <code>todos</code>.</p>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Prueba la ruta en <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/supabase-test">/supabase-test</Link>.
      </p>
    </main>
  );
}
