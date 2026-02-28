import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// In-memory store (replace with PostgreSQL)
interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: 3 | 4 | 5;
  avatarColor: string;
  language: 'en' | 'es';
  createdAt: string;
}

const children: ChildProfile[] = [];
const AVATAR_COLORS = ['#ff6fd8', '#3813c2', '#00d4ff', '#ff9500', '#00e676', '#ff4081'];

// GET /api/children - Get all children for current parent
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parentChildren = children.filter(c => c.parentId === req.user?.userId);
  res.json(parentChildren);
});

// POST /api/children - Add a child profile
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { name, age } = req.body;

  if (!name || !age) {
    res.status(400).json({ error: 'Name and age are required' });
    return;
  }

  if (![3, 4, 5].includes(age)) {
    res.status(400).json({ error: 'Age must be 3, 4, or 5' });
    return;
  }

  const parentChildren = children.filter(c => c.parentId === req.user?.userId);

  // COPPA: Limit number of child profiles per parent
  if (parentChildren.length >= 5) {
    res.status(400).json({ error: 'Maximum of 5 child profiles allowed' });
    return;
  }

  const child: ChildProfile = {
    id: uuidv4(),
    parentId: req.user!.userId,
    name: name.trim(),
    age,
    avatarColor: AVATAR_COLORS[parentChildren.length % AVATAR_COLORS.length],
    language: 'en',
    createdAt: new Date().toISOString(),
  };

  children.push(child);
  res.status(201).json(child);
});

// PUT /api/children/:id - Update child profile
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const child = children.find(c => c.id === req.params.id && c.parentId === req.user?.userId);

  if (!child) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  const { name, age, language } = req.body;
  if (name) child.name = name.trim();
  if (age && [3, 4, 5].includes(age)) child.age = age;
  if (language && ['en', 'es'].includes(language)) child.language = language;

  res.json(child);
});

// DELETE /api/children/:id - Remove child profile
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const index = children.findIndex(c => c.id === req.params.id && c.parentId === req.user?.userId);

  if (index === -1) {
    res.status(404).json({ error: 'Child profile not found' });
    return;
  }

  children.splice(index, 1);
  res.json({ message: 'Child profile removed' });
});

export default router;
