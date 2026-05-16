import type { APIRoute } from 'astro';
import { listTransactions, createTransaction } from '../../../../lib/db';
import { validateTransaction } from '../../../../lib/validation';
import { withErrorHandling, jsonResponse } from '../../../../lib/handler';

export const prerender = false;

export const GET: APIRoute = ({ params }) =>
  withErrorHandling(() => listTransactions(params.id!));

export const POST: APIRoute = ({ params, request }) =>
  withErrorHandling(async () => {
    const body = await request.json();
    const input = validateTransaction(body);
    const tx = await createTransaction({ accountId: params.id!, ...input });
    return jsonResponse(tx, 201);
  });
