import type { Context } from 'hono';

export function healthRoute(context: Context): Response {
  return context.json({ status: 'ok' });
}
