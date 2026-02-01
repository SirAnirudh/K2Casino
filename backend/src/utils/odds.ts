/**
 * Odds calculation logic for Serpent's Lair
 * Multipliers are based on the risk associated with reaching a target score.
 */

export interface ParlayTargets {
    targetScore?: number;
    timeTarget?: number;
    survivalTarget?: number;
    clicksTarget?: number;
}

export type SnakeSpeed = 'SLOW' | 'NORMAL' | 'FAST' | 'VERY_FAST' | 'LIGHTNING';

const SPEED_MODIFIERS: Record<SnakeSpeed, number> = {
    SLOW: 0.5,
    NORMAL: 1.0,
    FAST: 1.5,
    VERY_FAST: 2.0,
    LIGHTNING: 3.0,
};

const SCORE_ODDS = [
    { min: 1, multiplier: 1.2 },
    { min: 6, multiplier: 1.5 },
    { min: 11, multiplier: 2.5 },
    { min: 21, multiplier: 5.0 },
    { min: 36, multiplier: 12.0 },
    { min: 51, multiplier: 30.0 },
    { min: 76, multiplier: 100.0 },
    { min: 101, multiplier: 500.0 },
];

/**
 * Calculates the total multiplier for a parlay bet.
 */
export const calculateParlayMultiplier = (targets: ParlayTargets, speed: SnakeSpeed = 'NORMAL'): number => {
    let multiplier = 1.0;
    let activeTargets = 0;

    // 1. Score Target Multiplier
    if (targets.targetScore && targets.targetScore > 0) {
        const bracket = [...SCORE_ODDS].reverse().find(b => targets.targetScore! >= b.min);
        multiplier *= bracket ? bracket.multiplier : 1.0;
        activeTargets++;
    }

    // 2. Time Target (Collect coins within X seconds)
    if (targets.targetScore && targets.targetScore > 0 && targets.timeTarget && targets.timeTarget > 0) {
        // Difficulty = (Target Score / Time) 
        // Example: 10 coins in 10 seconds (diff 1) vs 10 coins in 5s (diff 2)
        const difficulty = (targets.targetScore / targets.timeTarget);
        const timeBonus = 1.0 + (difficulty * 0.5); // Scalable bonus
        multiplier *= Math.max(1.1, timeBonus);
        activeTargets++;
    }

    // 3. Survival Target (If no coins selected)
    if ((!targets.targetScore || targets.targetScore === 0) && targets.survivalTarget && targets.survivalTarget > 0) {
        // Multiplier scales with survival time
        const survivalBonus = 1.0 + (targets.survivalTarget / 30); // 1.1x for 3s, 2x for 30s
        multiplier *= survivalBonus;
        activeTargets++;
    }

    // 4. Clicks Target (Constraint)
    if (targets.clicksTarget && targets.clicksTarget > 0) {
        // Fewer clicks = higher multiplier
        // Difficulty baseline: assume 1 click per score or 1 click per 2 seconds survival
        const baseline = (targets.targetScore || 0) + (targets.survivalTarget || 0) / 2;
        const clickDifficulty = baseline / targets.clicksTarget;
        const clickBonus = 1.0 + (clickDifficulty * 0.3);
        multiplier *= Math.max(1.1, clickBonus);
        activeTargets++;
    }

    // Parlay Compound Bonus: Extra reward for stacking targets
    if (activeTargets > 1) {
        multiplier *= (1 + (activeTargets - 1) * 0.1); // 1.1x for 2 targets, 1.2x for 3, etc.
    }

    // Speed Modifier
    multiplier *= SPEED_MODIFIERS[speed];

    return parseFloat(multiplier.toFixed(2));
};

/**
 * Calculates the total potential payout.
 */
export const calculatePayout = (betAmount: number, targets: ParlayTargets, speed: SnakeSpeed = 'NORMAL'): number => {
    if (betAmount <= 0) return 0;
    const multiplier = calculateParlayMultiplier(targets, speed);
    return Math.floor(betAmount * multiplier);
};

// Compatibility export
export const getMultiplier = (targetScore: number): number => {
    return calculateParlayMultiplier({ targetScore }, 'NORMAL');
};
