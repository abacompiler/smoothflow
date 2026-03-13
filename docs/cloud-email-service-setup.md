# Servizio notifiche email sempre attivo (gratuito)

Questa implementazione usa una coda eventi locale in Smoothflow e una API cloud sempre attiva per elaborare gli eventi e inviare email anche quando il PC è spento.

## Stack consigliato

- **Cloudflare Workers**: API + logica (free tier)
- **Cloudflare D1**: database eventi/impostazioni (free tier)
- **Cloudflare Cron Triggers**: scheduler digest/rule checks (free tier)
- **Brevo**: provider SMTP/API email (free tier)

## Flusso implementato nell'app

1. Alla creazione/modifica/cancellazione attività l'app aggiunge un evento nella coda locale (`smoothflow.cloud.pendingEvents`).
2. L'app prova a sincronizzare gli eventi all'endpoint `POST /v1/events/bulk`.
3. L'app sincronizza anche le impostazioni utente (`PUT /v1/users/settings`) da pannello impostazioni.
4. È disponibile un test rapido email via `POST /v1/notifications/test-email`.

## Endpoint che il backend cloud deve esporre

### `POST /v1/events/bulk`
Body:

```json
{
  "user_id": "user-123",
  "events": [
    {
      "id": "uuid",
      "occurredAt": "2026-01-01T10:00:00.000Z",
      "entityType": "activity",
      "eventType": "created",
      "entityId": "activity-id",
      "payload": { "title": "Call", "start_time": "10:30" },
      "meta": {}
    }
  ]
}
```

Response consigliata:

```json
{ "acknowledged_event_ids": ["uuid"] }
```

### `PUT /v1/users/settings`
Body:

```json
{
  "user_id": "user-123",
  "reminder_email": "nome@example.com",
  "email_notifications_enabled": true
}
```

### `POST /v1/notifications/test-email`
Body:

```json
{ "user_id": "user-123" }
```

## Deploy rapido (Cloudflare)

1. Crea account Cloudflare gratuito.
2. Installa CLI: `npm i -g wrangler`.
3. Crea Worker: `npm create cloudflare@latest smoothflow-mail-worker`.
4. Abilita D1: `wrangler d1 create smoothflow_mail_db`.
5. Aggiungi binding DB in `wrangler.toml`.
6. Imposta secret Brevo:
   - `wrangler secret put BREVO_API_KEY`
   - `wrangler secret put BREVO_SENDER_EMAIL`
7. Deploy: `wrangler deploy`.
8. Copia URL Worker e configuralo in Smoothflow > Impostazioni.

## Schema D1 minimo

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  reminder_email TEXT,
  email_notifications_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);
```

## Esempio Worker (scheletro)

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/v1/events/bulk') {
      const body = await request.json();
      const ack = [];

      for (const event of body.events ?? []) {
        await env.DB
          .prepare(`INSERT OR IGNORE INTO events (event_id, user_id, occurred_at, event_type, entity_type, entity_id, payload_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            event.id,
            body.user_id,
            event.occurredAt,
            event.eventType,
            event.entityType,
            event.entityId ?? null,
            JSON.stringify(event.payload ?? {}),
            new Date().toISOString()
          )
          .run();
        ack.push(event.id);
      }

      return Response.json({ acknowledged_event_ids: ack });
    }

    if (request.method === 'PUT' && url.pathname === '/v1/users/settings') {
      const body = await request.json();
      await env.DB
        .prepare(`INSERT INTO user_settings (user_id, reminder_email, email_notifications_enabled, updated_at)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT(user_id) DO UPDATE SET
                    reminder_email = excluded.reminder_email,
                    email_notifications_enabled = excluded.email_notifications_enabled,
                    updated_at = excluded.updated_at`)
        .bind(
          body.user_id,
          body.reminder_email ?? '',
          body.email_notifications_enabled ? 1 : 0,
          new Date().toISOString()
        )
        .run();
      return Response.json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/v1/notifications/test-email') {
      const body = await request.json();
      const row = await env.DB
        .prepare('SELECT reminder_email, email_notifications_enabled FROM user_settings WHERE user_id = ?')
        .bind(body.user_id)
        .first();

      if (!row?.reminder_email || !row?.email_notifications_enabled) {
        return Response.json({ error: 'recipient_not_configured' }, { status: 400 });
      }

      const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'api-key': env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { email: env.BREVO_SENDER_EMAIL, name: 'Smoothflow' },
          to: [{ email: row.reminder_email }],
          subject: 'Test email Smoothflow cloud',
          htmlContent: '<p>Test riuscito: il servizio cloud è operativo.</p>'
        })
      });

      if (!emailRes.ok) {
        return Response.json({ error: 'provider_failed' }, { status: 502 });
      }

      return Response.json({ ok: true });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

## Attivazione in Smoothflow

1. Apri **Impostazioni**.
2. Compila:
   - abilita "Servizio cloud notifiche email"
   - URL API cloud
   - ID utente cloud
   - token (facoltativo)
3. Premi **Sincronizza ora**.
4. Premi **Test email da cloud**.

Dopo questa configurazione, gli eventi creati localmente verranno accodati e inviati al backend appena l'app è online.
