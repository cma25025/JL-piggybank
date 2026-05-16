import type { APIRoute } from 'astro';
import { getAccount, updateAccount, softDeleteAccount } from '../../../../lib/db';
import { validateAccount, ValidationError } from '../../../../lib/validation';
import { withErrorHandling, jsonResponse } from '../../../../lib/handler';

export const prerender = false;

export const GET: APIRoute = ({ params }) =>
  withErrorHandling(async () => {
    const id = params.id!;
    const account = await getAccount(id);
    if (!account) throw new ValidationError('Account not found', 404);
    return account;
  });

export const PUT: APIRoute = ({ params, request }) =>
  withErrorHandling(async () => {
    const id = params.id!;
    const body = await request.json();
    const input = validateAccount(body);
    return updateAccount(id, {
      name: input.name,
      interest_rate: input.interest_rate,
      compounding_period: input.compounding_period
    });
  });

export const DELETE: APIRoute = ({ params }) =>
  withErrorHandling(async () => {
    await softDeleteAccount(params.id!);
    return new Response(null, { status: 204 });
  });
