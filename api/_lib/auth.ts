import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'parent';
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/**
 * Extract and verify the user from a request's Authorization header.
 * Returns null if no valid token is found.
 */
export function getUserFromRequest(req: VercelRequest): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.split(' ')[1];
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
