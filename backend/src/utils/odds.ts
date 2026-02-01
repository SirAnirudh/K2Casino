/**
 * Odds calculation logic for Serpent's Lair
 * Multipliers are based on the risk associated with reaching a target score.
 */

export interface OddsBracket {
    minScore: number;
    maxScore: number;
    multiplier: number;
}

const ODDS_BRACKETS: OddsBracket[] = [
    { minScore: 1, maxScore: 5, multiplier: 1.2 },
    { minScore: 6, maxScore: 10, multiplier: 1.5 },
    { minScore: 11, maxScore: 20, multiplier: 2.5 },
    { minScore: 21, maxScore: 35, multiplier: 5.0 },
    { minScore: 36, maxScore: 50, multiplier: 12.0 },
    { minScore: 51, maxScore: 75, multiplier: 30.0 },
    { minScore: 76, maxScore: 100, multiplier: 100.0 },
    { minScore: 101, maxScore: 999, multiplier: 500.0 },
];

/**
 * Calculates the potential payout for a given bet and target score.
 * @param betAmount The amount of credit placed on the bet
 * @param targetScore The number of coins the player aims to collect
 * @returns The total potential payout (including the original bet)
 */
export const calculatePayout = (betAmount: number, targetScore: number): number => {
    if (targetScore <= 0 || betAmount <= 0) return 0;

    const bracket = ODDS_BRACKETS.find(b => targetScore >= b.minScore && targetScore <= b.maxScore);
    const multiplier = bracket ? bracket.multiplier : 1;

    return Math.floor(betAmount * multiplier);
};

/**
 * Returns the multiplier for a given target score
 */
export const getMultiplier = (targetScore: number): number => {
    const bracket = ODDS_BRACKETS.find(b => targetScore >= b.minScore && targetScore <= b.maxScore);
    return bracket ? bracket.multiplier : 1;
};
