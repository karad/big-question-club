import type { Context } from 'hono';

/**
 * Reports whether the worker is available.
 * @param context - Hono request context.
 * @returns A successful health-check response.
 */
export function healthRoute(context: Context): Response {
  return context.json({ status: 'ok' });
}
