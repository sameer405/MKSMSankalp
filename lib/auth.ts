import jwt from 'jsonwebtoken';
import { AuthError } from './errors';
import { NextRequest } from 'next/server';

// Runtime validation helper
const getJwtSecret = (): string => {
  if (!process.env.JWT_SIGNING_SECRET) {
    throw new Error('Missing JWT_SIGNING_SECRET environment variable');
  }
  return process.env.JWT_SIGNING_SECRET;
};

export interface TokenPayload {
  sub: string; // user ID
  reg_no: string;
  email: string;
  iat?: number;
}

// Sign a JWT token (no expiry)
export const signToken = (payload: Omit<TokenPayload, 'iat'>): string => {
  const secret = getJwtSecret();
  // No expiration - token is valid indefinitely
  return jwt.sign(payload, secret);
};

// Verify and decode a JWT token
export const verifyToken = (token: string): TokenPayload => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token');
    }
    throw new AuthError('Token verification failed');
  }
};

// Extract and verify token from request headers
export const requireAuth = (request: NextRequest): TokenPayload => {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new AuthError('Missing authorization header');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthError('Invalid authorization format. Expected: Bearer <token>');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new AuthError('Missing token');
  }

  return verifyToken(token);
};

// Check if user is admin
export const isAdmin = (email: string): boolean => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
  return adminEmails.includes(email);
};

// Require admin authentication
export const requireAdmin = (request: NextRequest): TokenPayload => {
  const user = requireAuth(request);

  if (!isAdmin(user.email)) {
    throw new AuthError('Admin access required');
  }

  return user;
};

