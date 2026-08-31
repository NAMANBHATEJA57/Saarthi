import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export type SuccessResponse<T> = {
  data: T;
};

export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  message: string,
  code: string = 'INTERNAL_SERVER_ERROR',
  status = 500,
  details?: unknown
) {
  if (status >= 500) {
    logger.error({ code, message, details }, 'API Error');
  }
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodError = error as any;
    return apiError('Validation failed', 'VALIDATION_ERROR', 400, zodError.errors || zodError.issues);
  }

  logger.error(error, 'Unhandled API Exception');
  return apiError('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500);
}
