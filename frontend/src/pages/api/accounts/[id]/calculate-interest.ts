import type { APIRoute } from 'astro';
import { calculateInterest } from '../../../../lib/db';
import { withErrorHandling } from '../../../../lib/handler';

export const prerender = false;

export const POST: APIRoute = ({ params }) =>
  withErrorHandling(async () => {
    const interest = await calculateInterest(params.id!);
    if (interest === null) return { message: 'No interest due' };
    return { message: 'Interest calculated', amount: interest };
  });
