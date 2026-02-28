import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Handle CORS headers for all API routes.
 * Returns true if the request was a preflight OPTIONS request (already handled).
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigin = process.env.FRONTEND_URL || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
