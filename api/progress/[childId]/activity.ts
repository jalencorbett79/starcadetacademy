import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../../_lib/cors';
import { getUserFromRequest } from '../../_lib/auth';
import { query, initDB } from '../../_lib/db';

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getRankFromLevel(level: number): string {
  if (level <= 5) return 'beginnerExplorer';
  if (level <= 10) return 'spaceNewbie';
  if (level <= 20) return 'spaceExpert';
  return 'pilotMothership';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

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

    // POST — log activity and update XP
    if (req.method === 'POST') {
      const { type, module, score, xpEarned, timeSpentSeconds, skillUpdates } = req.body;

      if (!type || !module || score === undefined || !xpEarned) {
        return res.status(400).json({ error: 'Missing required fields: type, module, score, xpEarned' });
      }

      // Insert activity log
      const logResult = await query(
        'INSERT INTO activity_logs (child_id, activity_type, module, score, xp_earned, time_spent_seconds) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, child_id, activity_type, module, score, xp_earned, time_spent_seconds, created_at',
        [childId, type, module, score, xpEarned, timeSpentSeconds || 0]
      );
      const logRow = logResult.rows[0];

      // Ensure xp_progress row exists
      await query(
        'INSERT INTO xp_progress (child_id) VALUES ($1) ON CONFLICT (child_id) DO NOTHING',
        [childId]
      );

      // Build dynamic update for skills
      const skillCols: string[] = [];
      if (skillUpdates && typeof skillUpdates === 'object') {
        const skillMap: Record<string, string> = {
          letterRecognition: 'skill_letter_recognition',
          phonics: 'skill_phonics',
          sightWords: 'skill_sight_words',
          counting: 'skill_counting',
          addition: 'skill_addition',
        };
        for (const [key, val] of Object.entries(skillUpdates)) {
          const col = skillMap[key];
          if (col && typeof val === 'number') {
            skillCols.push(`${col} = LEAST(100, ${col} + ${Math.floor(val)})`);
          }
        }
      }

      const skillUpdate = skillCols.length > 0 ? `, ${skillCols.join(', ')}` : '';

      // Update progress
      const today = new Date().toISOString().split('T')[0];

      await query(`
        UPDATE xp_progress SET
          xp = xp + $1,
          missions_completed = missions_completed + 1,
          streak_days = CASE
            WHEN last_active_date = ($2::date - INTERVAL '1 day')::date THEN streak_days + 1
            WHEN last_active_date = $2::date THEN streak_days
            ELSE 1
          END,
          last_active_date = $2::date,
          updated_at = NOW()
          ${skillUpdate}
        WHERE child_id = $3
      `, [xpEarned, today, childId]);

      // Recalculate level and rank
      const progressResult = await query('SELECT xp FROM xp_progress WHERE child_id = $1', [childId]);
      const newXP = progressResult.rows[0].xp;
      const newLevel = getLevelFromXP(newXP);
      const newRank = getRankFromLevel(newLevel);

      await query(
        'UPDATE xp_progress SET level = $1, rank = $2 WHERE child_id = $3',
        [newLevel, newRank, childId]
      );

      // Return the activity log entry
      return res.status(201).json({
        activity: {
          id: logRow.id,
          childId: logRow.child_id,
          type: logRow.activity_type,
          module: logRow.module,
          score: logRow.score,
          xpEarned: logRow.xp_earned,
          timeSpentSeconds: logRow.time_spent_seconds,
          createdAt: logRow.created_at,
        },
        xp: newXP,
        level: newLevel,
        rank: newRank,
      });
    }

    // GET — list activities
    if (req.method === 'GET') {
      const result = await query(
        'SELECT id, child_id, activity_type, module, score, xp_earned, time_spent_seconds, created_at FROM activity_logs WHERE child_id = $1 ORDER BY created_at DESC LIMIT 50',
        [childId]
      );

      return res.status(200).json(
        result.rows.map((r) => ({
          id: r.id,
          childId: r.child_id,
          type: r.activity_type,
          module: r.module,
          score: r.score,
          xpEarned: r.xp_earned,
          timeSpentSeconds: r.time_spent_seconds,
          createdAt: r.created_at,
        }))
      );
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Activity API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
