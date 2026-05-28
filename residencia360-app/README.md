# Residencia360

Sistema de informacion para la unidad residencial "Altos de Santa Clara". Implementa el alcance del MVP definido en los entregables del curso de Diseno de Sistemas de Informacion: control de accesos por roles, visitas + portera, PQRS con SLA, reservas de zonas comunes, comunicados, cartera, reportes y CRUDs administrativos.

## Stack

- **Frontend / Backend:** Next.js 15 (App Router + Server Actions) + React 19 + TypeScript + Tailwind CSS
- **Persistencia:** PostgreSQL via Prisma ORM
- **Autenticacion:** NextAuth (Credentials provider, JWT)
- **Adjuntos:** Supabase Storage
- **Email transaccional:** Supabase Edge Function `send-notification` (Resend bajo el capo)
- **Despliegue objetivo:** Vercel (app) + Supabase (Postgres + Storage + Edge Functions)

La arquitectura sigue el modelo C4 del Entregable N.º 2 (SPA + API + DB) con organizacion en capas (presentacion / aplicacion / dominio / persistencia) y los patrones GoF formalizados en `src/server/domain/`.

## Patrones implementados

| Patron | Donde |
|---|---|
| **Strategy** | `src/server/domain/policies/sla-policy.ts`, `reservation-rules.ts` |
| **State** | `src/server/domain/entities/visit.ts`, `pqrs.ts` |
| **Observer** | `src/server/domain/events/event-bus.ts` + `src/server/services/notifications/notification-service.ts` |
| **Factory Method** | `src/server/services/notifications/notification-factory.ts` |
| **Repository (DIP)** | `src/server/repositories/{interfaces,prisma}` |

## Requisitos

- Node.js 20+
- npm
- Docker Desktop o Postgres 15+ local
- (Opcional) Cuenta de Supabase para Storage + email

## Setup local

Desde la carpeta `residencia360-app`:

```bash
cp .env.example .env
# Edita .env con tus valores (DATABASE_URL minimo)

docker compose up -d
npm install                       # ejecuta postinstall: prisma generate
npm run db:push                   # aplica el schema a la BD local
npm run db:seed                   # crea usuarios + datos demo
npm run dev
```

La app queda en `http://localhost:3000`.

## Usuarios demo

Contrasena comun: `Residencia360!`

| Email | Rol |
|---|---|
| `admin@residencia360.local` | ADMIN |
| `vigilante@residencia360.local` | GUARD |
| `residente1@residencia360.local` | RESIDENT |
| `consejo@residencia360.local` | BOARD |
| `proveedor@residencia360.local` | CONTRACTOR |

## Caracteristicas

- Autenticacion con bloqueo (5 intentos = 15 min) y recuperacion por token.
- Pre-registro de visitas con QR, ventana ±2h (RN-03), maquina de estados.
- Porteria con escaneo QR por camara (html5-qrcode) y entrada manual.
- PQRS con SLA por prioridad (4h Critica / 24h Alta / 72h Media / 7d Baja) y cierre obligatorio con respuesta + evidencia (RN-10).
- Reservas con reglas configurables (anticipacion, max semanal, mora, capacidad, mantenimiento).
- Comunicados segmentados (toda la unidad / torre / bloque) + criticos.
- Cartera con envio de comprobantes y validacion administrativa.
- Reportes con filtros + export CSV.
- CRUDs administrativos: usuarios, torres, unidades, zonas comunes, bloqueos, proveedores, parqueaderos.
- Auditoria inmutable y notificaciones in-app + email.

## Despliegue a produccion (Vercel + Supabase)

### 1. Crear proyecto Supabase

1. Crea un proyecto en https://supabase.com.
2. En Storage, crea los buckets privados:
   - `pqrs-attachments`
   - `announcement-attachments`
   - `payment-supports`

   Sugerencia de RLS para cada bucket: lectura/escritura solo a `authenticated` cuyo claim de rol sea `ADMIN` o que coincida con el dueno del recurso.

3. Copia las claves desde *Project Settings > API*:
   - `Project URL` -> `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` -> `SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`

4. Anota las connection strings desde *Project Settings > Database*:
   - **Connection pooling (Transaction)** -> `DATABASE_URL` (agrega `?pgbouncer=true&connection_limit=1`)
   - **Direct connection** -> `DIRECT_URL`

### 2. Desplegar la Edge Function de email

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM_ADDRESS="Residencia360 <noreply@tu-dominio.com>"
supabase functions deploy send-notification
```

Sin Resend la function degrada a log y la app sigue funcionando (notificaciones in-app).

### 3. Migrar la base de datos

Desde local, apuntando a Supabase:

```bash
DATABASE_URL="$SUPABASE_DIRECT_URL" npx prisma migrate deploy
DATABASE_URL="$SUPABASE_DIRECT_URL" npm run db:seed   # opcional, datos demo
```

### 4. Configurar Vercel

1. Importa el repo en Vercel (Root Directory en la raiz del repo).
2. El `vercel.json` ya define `buildCommand` y `installCommand` para entrar a `residencia360-app/`.
3. Configura *Environment Variables*:
   - `DATABASE_URL` (pooler)
   - `DIRECT_URL` (direct)
   - `AUTH_SECRET` (genera con `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (`https://tu-app.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET_PQRS`, `SUPABASE_STORAGE_BUCKET_ANNOUNCEMENTS`, `SUPABASE_STORAGE_BUCKET_PAYMENTS`
4. Deploy. El script `vercel-build` corre `prisma migrate deploy && next build`.

### 5. Verificacion

- `https://tu-app.vercel.app/auth/sign-in` -> login con un usuario seed.
- Crear PQRS con adjunto -> verifica que el archivo aparezca en el bucket `pqrs-attachments`.
- Recuperar contrasena -> revisa la inbox o los logs de la Edge Function.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build de produccion |
| `npm run start` | servir build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma generate |
| `npm run db:push` | sincronizar schema (sin migracion) |
| `npm run db:migrate` | crear migracion en dev |
| `npm run db:deploy` | aplicar migraciones en prod |
| `npm run db:seed` | poblar BD demo |
| `npm run vercel-build` | usado por Vercel |
