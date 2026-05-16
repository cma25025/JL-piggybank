import { ValidationError } from './validation';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const result = await fn();
    if (result instanceof Response) return result;
    return jsonResponse(result);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error('API error:', err);
    const message =
      err?.message && typeof err.message === 'string' ? err.message : 'Internal Server Error';
    return jsonResponse({ error: message }, 500);
  }
}
