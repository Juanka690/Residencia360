# Supabase Edge Functions

## send-notification

Funcion responsable de enviar emails transaccionales (visitas, PQRS, reservas, password reset, comunicados). El backend Next.js la invoca via `supabase.functions.invoke('send-notification', { body })` desde `src/server/services/notifications/channels/email-channel.ts`.

### Despliegue

```bash
# 1. Login y link al proyecto
supabase login
supabase link --project-ref <PROJECT_REF>

# 2. Variables de entorno (provider de email)
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM_ADDRESS="Residencia360 <noreply@tu-dominio.com>"

# 3. Deploy
supabase functions deploy send-notification
```

### Comportamiento

- Si `RESEND_API_KEY` no esta configurada, la funcion devuelve `200 { delivered: false, simulated: true }`. Esto permite ejecutar el backend en local sin cuenta de Resend (los emails se loguean).
- Si esta configurada, envia via Resend y retorna el `id` del proveedor.
- CORS habilitado para invocacion desde el servidor Next.js.

### Test local

```bash
supabase functions serve send-notification --env-file ./supabase/.env.local

curl -X POST http://localhost:54321/functions/v1/send-notification \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Hola","text":"Esto es una prueba"}'
```
