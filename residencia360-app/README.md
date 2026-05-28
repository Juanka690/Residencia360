# Residencia360

Sistema web para la unidad residencial "Altos de Santa Clara", alineado al entregable del curso: acceso por roles, visitantes, porteria, PQRS, reservas, cartera y reportes.

## Requisitos

- Node.js 20+
- npm
- PostgreSQL 15+ o Docker Desktop

## Levantar la base local

Desde la carpeta `residencia360-app`:

```bash
docker compose up -d
```

Si ya tienes PostgreSQL corriendo localmente, valida que `DATABASE_URL` en `.env` apunte a una base accesible.

## Preparar la aplicacion

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

La aplicacion quedara disponible en `http://localhost:3000`.

## Usuarios demo

Contrasena comun:

```text
Residencia360!
```

Correos demo:

- `admin@residencia360.local`
- `vigilante@residencia360.local`
- `residente1@residencia360.local`
- `consejo@residencia360.local`
- `proveedor@residencia360.local`

## Login y recuperacion

- Login con credenciales y redireccion segun rol.
- Bloqueo temporal tras 5 intentos fallidos durante 15 minutos.
- Recuperacion local de contrasena mediante token temporal.

## Cobertura actual del MVP

- Autenticacion y roles
- Pre-registro y control de visitas
- Porteria con ingreso/salida
- Anuncios
- PQRS con adjuntos y cierre con evidencia
- Reservas de zonas comunes
- Estado de cuenta y validacion manual de pagos
- Reportes con filtros y exportacion CSV
