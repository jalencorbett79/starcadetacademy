import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_lib/cors';
import { getUserFromRequest } from '../_lib/auth';
import { query, initDB } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Child ID is required' });
  }

  try {
    await initDB();

    // PUT /api/children/:id — update child profile
    if (req.method === 'PUT') {
      // Verify ownership
      const check = await query(
        'SELECT id FROM child_profiles WHERE id = $1 AND parent_id = $2',
        [id, authUser.userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Child profile not found' });
      }

      const { name, age, language } = req.body;
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      if (name) {
        updates.push(`name = $${paramIdx++}`);
        values.push(name.trim());
      }
      if (age && [3, 4, 5].includes(Number(age))) {
        updates.push(`age = $${paramIdx++}`);
        values.push(Number(age));
      }
      if (language && ['en', 'es'].includes(language)) {
        updates.push(`language = $${paramIdx++}`);
        values.push(language);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(
        `UPDATE child_profiles SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, parent_id, name, age, avatar_color, language, created_at`,
        values
      );

      return res.status(200).json(formatChild(result.rows[0]));
    }

    // DELETE /api/children/:id — remove child profile
    if (req.method === 'DELETE') {
      const result = await query(
        'DELETE FROM child_profiles WHERE id = $1 AND parent_id = $2 RETURNING id',
        [id, authUser.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Child profile not found' });
      }

      return res.status(200).json({ message: 'Child profile removed' });
    }

    // GET /api/children/:id — get single child
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, parent_id, name, age, avatar_color, language, created_at FROM child_profiles WHERE id = $1 AND parent_id = $2',
        [id, authUser.userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Child profile not found' });
      }
      return res.status(200).json(formatChild(result.rows[0]));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Children [id] API error:', err);
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
