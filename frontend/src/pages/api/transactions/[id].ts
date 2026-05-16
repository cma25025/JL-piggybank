import type { APIRoute } from 'astro';
import { updateTransaction, softDeleteTransaction } from '../../../lib/db';
import { validateTransactionUpdate } from '../../../lib/validation';
import { withErrorHandling } from '../../../lib/handler';

export const prerender = false;

export const PUT: APIRoute = ({ params, request }) =>
  withErrorHandling(async () => {
    const body = await request.json();
    const input = validateTransactionUpdate(body);
    return updateTransaction(params.id!, input);
  });

export const DELETE: APIRoute = ({ params }) =>
  withErrorHandling(async () => {
    await softDeleteTransaction(params.id!);
    return { message: 'Transaction deleted successfully' };
  });
