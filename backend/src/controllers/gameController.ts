import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const saveGameSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { score, duration, betAmount, targetScore } = req.body;

        // Validation
        if (typeof score !== 'number' || typeof duration !== 'number') {
            res.status(400).json({ error: 'Score and duration are required' });
            return;
        }

        const actualBetAmount = Number(betAmount) || 0;
        const actualTargetScore = Number(targetScore) || 0;

        // Calculate result
        const won = score >= actualTargetScore && actualTargetScore > 0;

        // Odds & Payout calculation
        const { calculatePayout } = await import('../utils/odds');
        const payout = won ? calculatePayout(actualBetAmount, actualTargetScore) : 0;

        // Save game session
        const gameSession = await prisma.gameSession.create({
            data: {
                userId: req.userId,
                score,
                duration,
                betAmount: actualBetAmount,
                targetScore: actualTargetScore,
                payout,
                won
            }
        });

        // Update user bank balance
        // If they placed a bet, we already subtracted it on the frontend (or we should)
        // For simplicity, let's assume we subtract the bet here if it's new, or just add the payout.
        // Better logic: Subtract bet when game starts (new endpoint or here), add payout here.
        // For this incremental step, let's just add the payout (profit) or subtract the loss.

        const netChange = won ? (payout - actualBetAmount) : -actualBetAmount;

        await prisma.user.update({
            where: { id: req.userId },
            data: {
                bankBalance: {
                    increment: netChange
                },
                totalWinnings: {
                    increment: won ? (payout - actualBetAmount) : 0
                },
                totalLosses: {
                    increment: won ? 0 : actualBetAmount
                }
            }
        });

        res.status(201).json({
            message: won ? 'Payout collected!' : 'House wins.',
            gameSession,
            won,
            payout
        });
    } catch (error) {
        console.error('Save game session error:', error);
        res.status(500).json({ error: 'Failed to process game result' });
    }
};

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const topScores = await prisma.gameSession.findMany({
            orderBy: { score: 'desc' },
            take: limit,
            select: {
                id: true,
                score: true,
                duration: true,
                completedAt: true,
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        res.json({ leaderboard: topScores });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};
