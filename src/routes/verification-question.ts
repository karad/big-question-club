import type { Context } from 'hono';

import { createQuestionResult } from '../domain/verification-question';

export function verificationQuestionRoute(context: Context): Response {
  return context.json(createQuestionResult(), 200, {
    'Cache-Control': 'no-store',
  });
}
