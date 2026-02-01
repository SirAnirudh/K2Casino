import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnakeGame } from '../components/SnakeGame/useSnakeGame';
import SnakeCanvas from '../components/SnakeGame/SnakeCanvas';
import { gameAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const SnakeGamePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const { gameState, setDirection, togglePause, reset, getDuration, gridSize } = useSnakeGame({
        gridSize: 20,
        speed: 150,
    });

    // Betting State
    const [isBetting, setIsBetting] = useState(true);
    const [betAmount, setBetAmount] = useState(100);
    const [targetScore, setTargetScore] = useState(10);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const hasAutoSaved = useRef(false);

    // Odds calculation for UI feedback
    const getMultiplier = (target: number) => {
        if (target >= 101) return 500.0;
        if (target >= 76) return 100.0;
        if (target >= 51) return 30.0;
        if (target >= 36) return 12.0;
        if (target >= 21) return 5.0;
        if (target >= 11) return 2.5;
        if (target >= 6) return 1.5;
        if (target >= 1) return 1.2;
        return 1;
    };

    const potentialPayout = Math.floor(betAmount * getMultiplier(targetScore));

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
        if (betAmount > (user?.bankBalance || 0)) {
            setSaveMessage('Insufficient credit for this bet.');
            return;
        }
        setIsBetting(false);
        setSaveMessage('');
        hasAutoSaved.current = false;
        reset();
    };

    const handleRestart = () => {
        setIsBetting(true);
        setSaveMessage('');
        hasAutoSaved.current = false;
        reset();
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
                targetScore
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
                    <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '2rem', color: 'var(--color-accent-gold)' }}>Place Your Stakes</h2>

                        <div className="input-group">
                            <label>BET AMOUNT ($)</label>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ textAlign: 'center', fontSize: '1.5rem' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>TARGET SCORE (COINS)</label>
                            <input
                                type="number"
                                value={targetScore}
                                onChange={(e) => setTargetScore(Math.max(1, parseInt(e.target.value) || 1))}
                                style={{ textAlign: 'center', fontSize: '1.5rem' }}
                            />
                        </div>

                        <div style={{ margin: '2rem 0', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed var(--color-accent-gold)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>POTENTIAL PAYOUT</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-success)' }}>${potentialPayout.toLocaleString()}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-accent-gold)', marginTop: '0.5rem' }}>ODDS: {getMultiplier(targetScore)}x</p>
                        </div>

                        {saveMessage && <div className="error" style={{ marginBottom: '1rem' }}>{saveMessage}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button onClick={handleStartGame} className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}>
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
                            gap: '1.5rem'
                        }}>
                            <div className="game-stat-box" style={{ flex: 1, border: gameState.score >= targetScore ? '2px solid var(--color-success)' : '1px solid var(--color-border)' }}>
                                <div className="game-stat-label">Loot Collected</div>
                                <div className="game-stat-value" style={{ color: gameState.score >= targetScore ? 'var(--color-success)' : 'var(--color-accent-toxic)' }}>
                                    {gameState.score.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>GOAL: {targetScore}</div>
                            </div>
                            <div className="game-stat-box" style={{ flex: 1 }}>
                                <div className="game-stat-label">Target Multiplier</div>
                                <div className="game-stat-value" style={{ color: '#fff' }}>
                                    {getMultiplier(targetScore)}x
                                </div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>EST. PAYOUT: ${potentialPayout.toLocaleString()}</div>
                            </div>
                            <div className="game-stat-box" style={{ flex: 1 }}>
                                <div className="game-stat-label">Stake</div>
                                <div className="game-stat-value" style={{ color: 'var(--color-accent-gold)' }}>
                                    ${betAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <SnakeCanvas gameState={gameState} gridSize={gridSize} />

                                {gameState.isPaused && (
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
                                        <h2 style={{ color: gameState.score >= targetScore ? 'var(--color-success)' : 'var(--color-accent-blood)', fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                            {gameState.score >= targetScore ? 'YOU WIN!' : 'BUSTED!'}
                                        </h2>

                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>Coins Collected</p>
                                            <p style={{
                                                fontSize: '3.5rem',
                                                fontWeight: '900',
                                                color: '#fff',
                                                textShadow: gameState.score >= targetScore ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 0 20px rgba(239, 68, 68, 0.5)'
                                            }}>
                                                {gameState.score}
                                            </p>
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                                TARGET WAS: {targetScore}
                                            </p>
                                        </div>

                                        {isSaving && <div className="spinner-small" style={{ marginBottom: '1rem' }}></div>}

                                        {saveMessage && (
                                            <div className={saveMessage.includes('WINNER') ? 'success' : 'error'} style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', width: '100%', maxWidth: '300px' }}>
                                                {saveMessage}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
                                            <button onClick={handleRestart} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                                                New Bet (R)
                                            </button>
                                            <button onClick={handleBackToHome} className="btn" style={{ padding: '0.8rem 2rem' }}>
                                                Return to Den
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
