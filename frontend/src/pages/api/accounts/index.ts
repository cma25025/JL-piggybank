import type { APIRoute } from 'astro';
import { listAccounts, createAccount } from '../../../lib/db';
import { validateAccount } from '../../../lib/validation';
import { withErrorHandling, jsonResponse } from '../../../lib/handler';

export const prerender = false;

export const GET: APIRoute = () => withErrorHandling(() => listAccounts());

export const POST: APIRoute = ({ request }) =>
  withErrorHandling(async () => {
    const body = await request.json();
    const input = validateAccount(body);
    const account = await createAccount(input);
    return jsonResponse(account, 201);
  });
