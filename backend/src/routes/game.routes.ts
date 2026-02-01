import { Router } from 'express';
import { saveGameSession, getLeaderboard } from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/save-session', authenticateToken, saveGameSession);
router.get('/leaderboard', getLeaderboard);

export default router;
