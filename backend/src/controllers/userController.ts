import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                username: true,
                email: true,
                bankBalance: true,
                totalWinnings: true,
                totalLosses: true,
                createdAt: true,
                gameSessions: {
                    orderBy: { completedAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        score: true,
                        duration: true,
                        betAmount: true,
                        targetScore: true,
                        payout: true,
                        won: true,
                        completedAt: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

export const getGameHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        const gameSessions = await prisma.gameSession.findMany({
            where: { userId: req.userId },
            orderBy: { completedAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                score: true,
                duration: true,
                completedAt: true
            }
        });

        const total = await prisma.gameSession.count({
            where: { userId: req.userId }
        });

        res.json({
            gameSessions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        console.error('Get game history error:', error);
        res.status(500).json({ error: 'Failed to fetch game history' });
    }
};
