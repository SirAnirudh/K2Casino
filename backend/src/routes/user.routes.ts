import { Router } from 'express';
import { getProfile, getGameHistory } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.get('/game-history', authenticateToken, getGameHistory);

export default router;
