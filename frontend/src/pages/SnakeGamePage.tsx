import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnakeGame } from '../components/SnakeGame/useSnakeGame';
import SnakeCanvas from '../components/SnakeGame/SnakeCanvas';
import { gameAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SnakeGamePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();

    // Betting State
    const [isBetting, setIsBetting] = useState(true);
    const [betAmount, setBetAmount] = useState(100);
    const [targetScore, setTargetScore] = useState(10);
    const [timeTarget, setTimeTarget] = useState(0);
    const [survivalTarget, setSurvivalTarget] = useState(0);
    const [clicksTarget, setClicksTarget] = useState(0);
    const [speedScale, setSpeedScale] = useState<any>('NORMAL');
    const [isDoubleOrNothing, setIsDoubleOrNothing] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const speedIntervals: Record<any, number> = {
        NORMAL: 100,
        FAST: 70,
        VERY_FAST: 50,
        LIGHTNING: 30,
    };

    const { gameState, setDirection, togglePause, reset, getDuration, gridSize } = useSnakeGame({
        gridSize: 20,
        speed: speedIntervals[speedScale] || 100,
        timeLimit: targetScore > 0 ? timeTarget : survivalTarget,
        clicksLimit: clicksTarget,
        targetScore: targetScore,
    });

    const [countdown, setCountdown] = useState<number | null>(null);
    const hasAutoSaved = useRef(false);

    // Countdown Timer
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished: Unpause and hide overlay
            const timer = setTimeout(() => {
                setCountdown(null);
                // The engine might be paused initially or we force it unpaused here
                if (gameState?.isPaused) togglePause();
            }, 1000); // Show "GO!" for 1 second
            return () => clearTimeout(timer);
        }
    }, [countdown, gameState?.isPaused, togglePause]);

    // Odds calculation for UI feedback
    const calculateMultiplier = () => {
        // Simple client-side preview of the logic in backend/src/utils/odds.ts
        let mult = 1.0;
        let active = 0;

        if (targetScore > 0) {
            if (targetScore >= 101) mult *= 500;
            else if (targetScore >= 76) mult *= 100;
            else if (targetScore >= 51) mult *= 30;
            else if (targetScore >= 36) mult *= 12;
            else if (targetScore >= 21) mult *= 5;
            else if (targetScore >= 11) mult *= 2.5;
            else if (targetScore >= 6) mult *= 1.5;
            else if (targetScore >= 1) mult *= 1.2;
            active++;
        }

        if (targetScore > 0 && timeTarget > 0) {
            mult *= (1.0 + (targetScore / timeTarget) * 0.5);
            active++;
        }

        if (targetScore === 0 && survivalTarget > 0) {
            mult *= (1.0 + (survivalTarget / 30));
            active++;
        }

        if (clicksTarget > 0) {
            const baseline = targetScore + survivalTarget / 2;
            mult *= (1.0 + (baseline / clicksTarget) * 0.3);
            active++;
        }

        if (active > 1) mult *= (1 + (active - 1) * 0.1);

        const speeds: Record<string, number> = { NORMAL: 1, FAST: 1.5, VERY_FAST: 2, LIGHTNING: 3 };
        mult *= (speeds[speedScale] || 1);

        return parseFloat(mult.toFixed(2));
    };

    const multiplier = calculateMultiplier();
    const potentialPayout = Math.floor(betAmount * multiplier);

    // Handle Auto-Save on Game Over
    useEffect(() => {
        if (gameState?.isGameOver && !hasAutoSaved.current && !isBetting) {
            handleSaveResult();
            hasAutoSaved.current = true;
        }
    }, [gameState?.isGameOver]);

    // Keyboard controls
    useEffect(() => {
        if (isBetting) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    setDirection('UP');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    setDirection('DOWN');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    setDirection('LEFT');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    setDirection('RIGHT');
                    break;
                case ' ':
                    e.preventDefault();
                    togglePause();
                    break;
                case 'r':
                case 'R':
                    if (gameState?.isGameOver) {
                        e.preventDefault();
                        handleRestart();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [setDirection, togglePause, reset, gameState?.isGameOver, isBetting]);

    const handleStartGame = () => {
        if (!isDoubleOrNothing && betAmount > (user?.bankBalance || 0)) {
            setSaveMessage('Insufficient credit for this bet.');
            return;
        }
        setIsBetting(false);
        setSaveMessage('');
        hasAutoSaved.current = false;
        reset();

        // Start countdown
        setCountdown(3);
        // Ensure engine starts paused
        if (gameState && !gameState.isPaused) togglePause();
    };

    const handleRestart = () => {
        setIsBetting(true);
        setIsDoubleOrNothing(false);
        setSaveMessage('');
        hasAutoSaved.current = false;
        reset();
    };

    const handleDoubleOrNothing = () => {
        // Use the potential payout from the previous win as the new bet amount
        // But we actually just pass the won flag to the backend
        setIsDoubleOrNothing(true);
        setIsBetting(false);
        setSaveMessage('');
        hasAutoSaved.current = false;
        reset();

        // Start countdown
        setCountdown(3);
    };

    const handleSaveResult = async () => {
        if (!gameState || !gameState.isGameOver) return;

        setIsSaving(true);
        setSaveMessage('');

        try {
            const response = await gameAPI.saveSession(
                gameState.score,
                getDuration(),
                betAmount,
                targetScore,
                timeTarget,
                survivalTarget,
                clicksTarget,
                speedScale,
                gameState.clicks,
                isDoubleOrNothing
            );

            const won = response.data.won;
            setSaveMessage(won ? `WINNER! Collected $${response.data.payout.toLocaleString()}` : 'Busted. The house always wins.');
            await refreshProfile();
        } catch (error) {
            setSaveMessage('Failed to record result. Table error.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackToHome = () => {
        navigate('/home');
    };

    if (!gameState) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '2rem', position: 'relative' }}>
            <div className="casino-glow"></div>
            <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0rem' }}>Serpent's Lair</h1>
                    <p style={{ color: 'var(--color-accent-gold)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 700 }}>THE HIGH STAKE DEN</p>
                </div>

                {isBetting ? (
                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-accent-gold)' }}>Place Your Stakes</h2>

                        {/* Bet Amount */}
                        <div className="input-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>STAKE ($)</span>
                                <span style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem' }}>MAX: ${user?.bankBalance.toLocaleString()}</span>
                            </label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ textAlign: 'center', fontSize: '1.5rem', borderColor: 'var(--color-accent-gold)' }}
                            />
                        </div>

                        {/* Speed Selection */}
                        <div className="input-group" style={{ marginBottom: '2rem' }}>
                            <label>SNAKE SPEED</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {['NORMAL', 'FAST', 'VERY_FAST', 'LIGHTNING'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSpeedScale(s)}
                                        className={`btn ${speedScale === s ? 'btn-primary' : ''}`}
                                        style={{
                                            flex: 1,
                                            fontSize: '0.6rem',
                                            padding: '0.5rem 0',
                                            background: speedScale === s ? '' : 'rgba(255,255,255,0.05)',
                                            border: speedScale === s ? '' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parlay Targets */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem' }}>COINS TARGET</label>
                                <input
                                    type="number"
                                    placeholder="Off"
                                    value={targetScore || ''}
                                    onChange={(e) => setTargetScore(Math.max(0, parseInt(e.target.value) || 0))}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem' }}>{targetScore > 0 ? 'TIME LIMIT (SEC)' : 'SURVIVAL (SEC)'}</label>
                                <input
                                    type="number"
                                    placeholder="Off"
                                    value={targetScore > 0 ? (timeTarget || '') : (survivalTarget || '')}
                                    onChange={(e) => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        if (targetScore > 0) setTimeTarget(val);
                                        else setSurvivalTarget(val);
                                    }}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.7rem' }}>MOVE CONSTRAINT (MAX CLICKS)</label>
                                <input
                                    type="number"
                                    placeholder="No Limit"
                                    value={clicksTarget || ''}
                                    onChange={(e) => setClicksTarget(Math.max(0, parseInt(e.target.value) || 0))}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                        </div>

                        <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '8px', border: '1px solid var(--color-accent-gold)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Parlay Payout</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-success)', margin: '0.2rem 0' }}>
                                ${potentialPayout.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-gold)' }}>ODDS: {multiplier.toFixed(2)}x</div>
                        </div>

                        {saveMessage && <div className="error" style={{ marginBottom: '1rem' }}>{saveMessage}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={handleStartGame}
                                className="btn btn-primary"
                                disabled={multiplier <= 1 && betAmount > 0}
                                style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
                            >
                                START THE RUN
                            </button>
                            <button onClick={handleBackToHome} className="btn" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Back to Den
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '1.5rem',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            <div className="game-stat-box" style={{ flex: 1, border: gameState.score >= targetScore ? '2px solid var(--color-success)' : '1px solid var(--color-border)' }}>
                                <div className="game-stat-label">Loot</div>
                                <div className="game-stat-value">{gameState.score}</div>
                                {targetScore > 0 && <div className="game-stat-meta">GOAL: {targetScore}</div>}
                            </div>
                            {(timeTarget > 0 || survivalTarget > 0) && (
                                <div className="game-stat-box" style={{ flex: 1 }}>
                                    <div className="game-stat-label">{targetScore > 0 ? 'Timer' : 'Surviving'}</div>
                                    <div className="game-stat-value">{getDuration()}s</div>
                                    <div className="game-stat-meta">{targetScore > 0 ? `LIMIT: ${timeTarget}s` : `GOAL: ${survivalTarget}s`}</div>
                                </div>
                            )}
                            {clicksTarget > 0 && (
                                <div className="game-stat-box" style={{ flex: 1 }}>
                                    <div className="game-stat-label">Moves</div>
                                    <div className="game-stat-value">{gameState.clicks}</div>
                                    <div className="game-stat-meta">MAX: {clicksTarget}</div>
                                </div>
                            )}
                            <div className="game-stat-box" style={{ flex: 1 }}>
                                <div className="game-stat-label">Stake</div>
                                <div className="game-stat-value" style={{ color: 'var(--color-accent-gold)' }}>
                                    ${betAmount.toLocaleString()}
                                </div>
                                <div className="game-stat-meta">{speedScale} ({multiplier}x)</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <SnakeCanvas gameState={gameState} gridSize={gridSize} />

                                {countdown !== null && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(2, 6, 23, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 30,
                                        pointerEvents: 'none'
                                    }}>
                                        <div style={{
                                            fontSize: '8rem',
                                            fontWeight: '900',
                                            color: countdown === 0 ? 'var(--color-success)' : 'var(--color-accent-gold)',
                                            textShadow: '0 0 40px rgba(0,0,0,0.5)',
                                            transform: 'scale(1.2)',
                                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}>
                                            {countdown === 0 ? 'GO!' : countdown}
                                        </div>
                                    </div>
                                )}

                                {gameState.isPaused && countdown === null && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(2, 6, 23, 0.8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        zIndex: 10
                                    }}>
                                        <h2 style={{ color: 'var(--color-accent-gold)', fontSize: '2.5rem' }}>TIME OUT</h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>THE HOUSE IS WAITING</p>
                                        <p style={{ color: 'var(--color-text-dim)' }}>Press SPACE to resume</p>
                                    </div>
                                )}

                                {gameState.isGameOver && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0, 0, 0, 0.9)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        padding: '2rem',
                                        zIndex: 20
                                    }}>
                                        <h2 style={{ color: saveMessage.includes('WINNER') ? 'var(--color-success)' : 'var(--color-accent-blood)', fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                            {saveMessage.includes('WINNER') ? 'SWEEP!' : 'BUSTED!'}
                                        </h2>

                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>Session Result</p>
                                            <p style={{
                                                fontSize: '2.5rem',
                                                fontWeight: '900',
                                                color: '#fff',
                                            }}>
                                                ${saveMessage.includes('WINNER') ? (potentialPayout).toLocaleString() : '0'}
                                            </p>
                                        </div>

                                        {isSaving && <div className="spinner-small" style={{ marginBottom: '1rem' }}></div>}

                                        {saveMessage && (
                                            <div className={saveMessage.includes('WINNER') ? 'success' : 'error'} style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', width: '100%', maxWidth: '300px', marginBottom: '1rem' }}>
                                                {saveMessage}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {saveMessage.includes('WINNER') && (
                                                <button onClick={handleDoubleOrNothing} className="btn" style={{ padding: '0.8rem 2rem', background: 'var(--color-accent-blood)', borderColor: 'var(--color-accent-blood)' }}>
                                                    DOUBLE OR NOTHING
                                                </button>
                                            )}
                                            <button onClick={handleRestart} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                                                New Parlay (R)
                                            </button>
                                            <button onClick={handleBackToHome} className="btn" style={{ padding: '0.8rem 2rem' }}>
                                                Return Home
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Controls</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--color-accent-gold)' }}>Arrow Keys / WASD</strong>
                                    <br />Control the Viper
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--color-accent-gold)' }}>SPACE</strong>
                                    <br />Call a Time Out
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--color-accent-gold)' }}>R</strong>
                                    <br />New Hand (when busted)
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default SnakeGamePage;
