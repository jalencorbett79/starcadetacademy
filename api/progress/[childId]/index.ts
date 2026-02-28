import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../_lib/cors';
import { getUserFromRequest } from '../../_lib/auth';
import { query, initDB } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { childId } = req.query;
  if (!childId || typeof childId !== 'string') {
    return res.status(400).json({ error: 'Child ID is required' });
  }

  try {
    await initDB();

    // Verify parent owns this child
    const childCheck = await query(
      'SELECT id FROM child_profiles WHERE id = $1 AND parent_id = $2',
      [childId, authUser.userId]
    );
    if (childCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Child profile not found' });
    }

    // Get progress
    const result = await query(
      'SELECT * FROM xp_progress WHERE child_id = $1',
      [childId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        childId,
        xp: 0,
        level: 1,
        rank: 'beginnerExplorer',
        missionsCompleted: 0,
        streakDays: 0,
        skills: {
          letterRecognition: 0,
          phonics: 0,
          sightWords: 0,
          counting: 0,
          addition: 0,
        },
      });
    }

    const p = result.rows[0];
    return res.status(200).json({
      childId: p.child_id,
      xp: p.xp,
      level: p.level,
      rank: p.rank,
      missionsCompleted: p.missions_completed,
      streakDays: p.streak_days,
      skills: {
        letterRecognition: p.skill_letter_recognition,
        phonics: p.skill_phonics,
        sightWords: p.skill_sight_words,
        counting: p.skill_counting,
        addition: p.skill_addition,
      },
    });
  } catch (err) {
    console.error('Progress GET error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
