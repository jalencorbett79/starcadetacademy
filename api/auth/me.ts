import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { getUserFromRequest } from '../_lib/auth';
import { query, initDB } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await initDB();

    const result = await query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [authUser.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
