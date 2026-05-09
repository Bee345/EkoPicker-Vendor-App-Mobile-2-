import { AxiosError } from 'axios';

export interface ApiErrorPayload {
  statusCode?: number;
  message?: string;
  errors?: { field: string; message: string }[];
}

/**
 * Extract a user-facing message from any thrown error.
 * Prefers the server's `{ message, errors[] }` payload over axios's stock string.
 */
export function parseApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'string') return err;

  const axiosErr = err as AxiosError<ApiErrorPayload>;
  const data = axiosErr?.response?.data;

  if (data?.errors?.length) {
    return data.errors.map((e) => e.message).join(', ');
  }
  if (data?.message) return data.message;

  if (err instanceof Error && err.message) return err.message;

  return fallback;
}

export class AuthExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.');
    this.name = 'AuthExpiredError';
  }
}
