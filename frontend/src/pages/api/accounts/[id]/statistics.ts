import type { APIRoute } from 'astro';
import { getAccountStatistics } from '../../../../lib/db';
import { ValidationError } from '../../../../lib/validation';
import { withErrorHandling } from '../../../../lib/handler';

export const prerender = false;

export const GET: APIRoute = ({ params }) =>
  withErrorHandling(async () => {
    const stats = await getAccountStatistics(params.id!);
    if (!stats) throw new ValidationError('Account not found', 404);
    return stats;
  });
