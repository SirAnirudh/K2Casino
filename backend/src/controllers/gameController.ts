import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const saveGameSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const {
            score,
            duration,
            betAmount,
            targetScore,
            timeTarget,
            survivalTarget,
            clicksTarget,
            speed,
            clicksUsed,
            isDoubleOrNothing
        } = req.body;

        // Validation
        if (typeof score !== 'number' || typeof duration !== 'number') {
            res.status(400).json({ error: 'Score and duration are required' });
            return;
        }

        const actualBetAmount = Number(betAmount) || 0;
        const actualTargetScore = Number(targetScore) || 0;
        const actualTimeTarget = Number(timeTarget) || 0;
        const actualSurvivalTarget = Number(survivalTarget) || 0;
        const actualClicksTarget = Number(clicksTarget) || 0;
        const actualClicksUsed = Number(clicksUsed) || 0;
        const actualSpeed = speed || 'NORMAL';

        // Calculate result (Parlay Logic: Must meet ALL active conditions)
        let won = true;
        let activeConditions = 0;

        // Condition 1: Score
        if (actualTargetScore > 0) {
            activeConditions++;
            if (score < actualTargetScore) won = false;
        }

        // Condition 2: Time to collect score
        if (actualTargetScore > 0 && actualTimeTarget > 0) {
            activeConditions++;
            if (duration > actualTimeTarget) won = false;
        }

        // Condition 3: Survival (no score target)
        if (actualTargetScore === 0 && actualSurvivalTarget > 0) {
            activeConditions++;
            if (duration < actualSurvivalTarget) won = false;
        }

        // Condition 4: Clicks constraint
        if (actualClicksTarget > 0) {
            activeConditions++;
            if (actualClicksUsed > actualClicksTarget) won = false;
        }

        // If no conditions were set, it's not a bet
        if (activeConditions === 0 && actualBetAmount > 0) won = false;

        // Odds & Payout calculation
        const { calculatePayout } = await import('../utils/odds');
        const payout = won ? calculatePayout(actualBetAmount, {
            targetScore: actualTargetScore,
            timeTarget: actualTimeTarget,
            survivalTarget: actualSurvivalTarget,
            clicksTarget: actualClicksTarget
        }, actualSpeed) : 0;

        // Save game session
        const gameSession = await prisma.gameSession.create({
            data: {
                userId: req.userId,
                score,
                duration,
                betAmount: actualBetAmount,
                targetScore: actualTargetScore,
                timeTarget: actualTimeTarget > 0 ? actualTimeTarget : null,
                survivalTarget: actualSurvivalTarget > 0 ? actualSurvivalTarget : null,
                clicksTarget: actualClicksTarget > 0 ? actualClicksTarget : null,
                speed: actualSpeed,
                clicksUsed: actualClicksUsed,
                isDoubleOrNothing: !!isDoubleOrNothing,
                payout,
                won
            }
        });

        // Update user bank balance
        // isDoubleOrNothing means no stake was taken from balance this time
        // because it's being "rolled over" from the previous win.
        // If they win, we add the PAYOUT. If they lose, we don't subtract again (already lost the potential winnings).

        let netChange = 0;
        if (!!isDoubleOrNothing) {
            // Double or Nothing: Stake is already "out there". 
            // If won, we add the profit (payout - stake) since they already had the stake in their potential winnings.
            // Actually, if they win, they get the full payout.
            // If they lose, we add NOTHING (they lost what they had).
            netChange = won ? payout : 0;
        } else {
            // Normal bet: Profit = payout - stake. Loss = -stake.
            netChange = won ? (payout - actualBetAmount) : -actualBetAmount;
        }

        await prisma.user.update({
            where: { id: req.userId },
            data: {
                bankBalance: {
                    increment: netChange
                },
                totalWinnings: {
                    increment: won ? (payout - (!!isDoubleOrNothing ? 0 : actualBetAmount)) : 0
                },
                totalLosses: {
                    increment: won ? 0 : (!!isDoubleOrNothing ? 0 : actualBetAmount)
                }
            }
        });

        res.status(201).json({
            message: won ? 'Sweep! Payout collected.' : 'The House takes the parlay.',
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
