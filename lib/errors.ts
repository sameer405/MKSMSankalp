import { NextResponse } from 'next/server';

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Centralized error handler
export const handleApiError = (error: unknown): NextResponse => {
  // Log the error
  console.error('API Error:', error);

  // Handle known error types
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, type: 'validation_error' },
      { status: 400 }
    );
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, type: 'auth_error' },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message, type: 'forbidden_error' },
      { status: 403 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message, type: 'not_found_error' },
      { status: 404 }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message, type: 'rate_limit_error' },
      { status: 429 }
    );
  }

  // Handle unknown errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message, type: 'internal_error' },
      { status: 500 }
    );
  }

  // Fallback for non-Error objects
  return NextResponse.json(
    { error: 'An unexpected error occurred', type: 'unknown_error' },
    { status: 500 }
  );
};

