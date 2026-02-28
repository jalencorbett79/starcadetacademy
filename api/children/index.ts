import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { getUserFromRequest } from '../_lib/auth';
import { query, initDB } from '../_lib/db';

const AVATAR_COLORS = ['#ff6fd8', '#3813c2', '#00d4ff', '#ff9500', '#00e676', '#ff4081'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    await initDB();

    // GET /api/children — list all children for this parent
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, parent_id, name, age, avatar_color, language, created_at FROM child_profiles WHERE parent_id = $1 ORDER BY created_at',
        [authUser.userId]
      );
      return res.status(200).json(result.rows.map(formatChild));
    }

    // POST /api/children — create a new child profile
    if (req.method === 'POST') {
      const { name, age } = req.body;

      if (!name || !age) {
        return res.status(400).json({ error: 'Name and age are required' });
      }

      if (![3, 4, 5].includes(Number(age))) {
        return res.status(400).json({ error: 'Age must be 3, 4, or 5' });
      }

      // COPPA: limit children per parent
      const countResult = await query(
        'SELECT COUNT(*) as cnt FROM child_profiles WHERE parent_id = $1',
        [authUser.userId]
      );
      const count = parseInt(countResult.rows[0].cnt, 10);
      if (count >= 5) {
        return res.status(400).json({ error: 'Maximum of 5 child profiles allowed' });
      }

      const avatarColor = AVATAR_COLORS[count % AVATAR_COLORS.length];

      const result = await query(
        'INSERT INTO child_profiles (parent_id, name, age, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, parent_id, name, age, avatar_color, language, created_at',
        [authUser.userId, name.trim(), Number(age), avatarColor]
      );

      // Also create initial xp_progress row
      await query(
        'INSERT INTO xp_progress (child_id) VALUES ($1) ON CONFLICT (child_id) DO NOTHING',
        [result.rows[0].id]
      );

      return res.status(201).json(formatChild(result.rows[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Children API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function formatChild(row: Record<string, unknown>) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    age: row.age,
    avatarColor: row.avatar_color,
    language: row.language,
    createdAt: row.created_at,
  };
}
