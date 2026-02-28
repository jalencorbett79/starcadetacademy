import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

interface XPProgress {
  id: string;
  childId: string;
  parentId: string;
  xp: number;
  level: number;
  rank: string;
  missionsCompleted: number;
  streakDays: number;
  lastActiveDate: string;
  skills: {
    letterRecognition: number;
    phonics: number;
    sightWords: number;
    counting: number;
    addition: number;
  };
}

interface ActivityLog {
  id: string;
  childId: string;
  type: 'reading' | 'counting';
  module: string;
  score: number;
  xpEarned: number;
  timeSpentSeconds: number;
  createdAt: string;
}

const progressData: XPProgress[] = [];
const activityLogs: ActivityLog[] = [];

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getRankFromLevel(level: number): string {
  if (level <= 5) return 'beginnerExplorer';
  if (level <= 10) return 'spaceNewbie';
  if (level <= 20) return 'spaceExpert';
  return 'pilotMothership';
}

// GET /api/progress/:childId - Get progress for a child
router.get('/:childId', authMiddleware, (req: AuthRequest, res: Response) => {
  const progress = progressData.find(
    p => p.childId === req.params.childId && p.parentId === req.user?.userId
  );

  if (!progress) {
    // Return default progress
    res.json({
      childId: req.params.childId,
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
    return;
  }

  res.json(progress);
});

// POST /api/progress/:childId/activity - Log an activity and update XP
router.post('/:childId/activity', authMiddleware, (req: AuthRequest, res: Response) => {
  const { type, module, score, xpEarned, timeSpentSeconds, skillUpdates } = req.body;

  if (!type || !module || score === undefined || !xpEarned) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Create activity log
  const log: ActivityLog = {
    id: uuidv4(),
    childId: req.params.childId,
    type,
    module,
    score,
    xpEarned,
    timeSpentSeconds: timeSpentSeconds || 0,
    createdAt: new Date().toISOString(),
  };
  activityLogs.push(log);

  // Update or create progress
  let progress = progressData.find(
    p => p.childId === req.params.childId && p.parentId === req.user?.userId
  );

  if (!progress) {
    progress = {
      id: uuidv4(),
      childId: req.params.childId,
      parentId: req.user!.userId,
      xp: 0,
      level: 1,
      rank: 'beginnerExplorer',
      missionsCompleted: 0,
      streakDays: 0,
      lastActiveDate: '',
      skills: {
        letterRecognition: 0,
        phonics: 0,
        sightWords: 0,
        counting: 0,
        addition: 0,
      },
    };
    progressData.push(progress);
  }

  // Update XP
  progress.xp += xpEarned;
  progress.level = getLevelFromXP(progress.xp);
  progress.rank = getRankFromLevel(progress.level);
  progress.missionsCompleted += 1;

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (progress.lastActiveDate === yesterday) {
      progress.streakDays += 1;
    } else if (progress.lastActiveDate !== today) {
      progress.streakDays = 1;
    }
    progress.lastActiveDate = today;
  }

  // Update skills
  if (skillUpdates && typeof skillUpdates === 'object') {
    for (const [skill, value] of Object.entries(skillUpdates)) {
      if (skill in progress.skills) {
        const key = skill as keyof typeof progress.skills;
        progress.skills[key] = Math.min(100, progress.skills[key] + (value as number));
      }
    }
  }

  res.json({ activity: log, progress });
});

// GET /api/progress/:childId/activities - Get activity history
router.get('/:childId/activities', authMiddleware, (req: AuthRequest, res: Response) => {
  const logs = activityLogs
    .filter(l => l.childId === req.params.childId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);

  res.json(logs);
});

export default router;
