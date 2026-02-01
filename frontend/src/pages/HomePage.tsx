import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GameCard from '../components/GameCard';

const HomePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="container" style={{ minHeight: '100vh', paddingTop: '2rem', position: 'relative' }}>
            <div className="casino-glow"></div>
            <div style={{ position: 'relative', zIndex: 1, padding: '0 2rem' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ marginBottom: '0rem' }}>Serpent's Lair</h1>
                        <p style={{ color: 'var(--color-accent-gold)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>VIPER'S DEN</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
                            Player: <span style={{ color: 'var(--color-accent-gold)', fontWeight: 'bold' }}>{user?.username}</span>
                        </p>
                    </div>
                    <button onClick={handleLogout} className="btn">
                        Leave Table
                    </button>
                </div>

                {/* Bank Balance */}
                <div className="card" style={{ marginBottom: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(5, 46, 22, 0.8) 0%, rgba(2, 6, 23, 0.9) 100%)', border: '1px solid var(--color-accent-gold)' }}>
                    <p style={{ color: 'var(--color-accent-gold)', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem' }}>AVAILABLE CREDIT</p>
                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '900',
                        color: '#fff',
                        textShadow: '0 0 20px rgba(217, 119, 6, 0.5)',
                        fontFamily: 'var(--font-body)'
                    }}>
                        <span style={{ color: 'var(--color-accent-gold)', marginRight: '4px' }}>$</span>{user?.bankBalance.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</p>
                            <p style={{ fontWeight: 'bold', color: 'var(--color-accent-gold)' }}>High Roller</p>
                        </div>
                        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
                        <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Account Type</p>
                            <p style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>VIP PLATINUM</p>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '4rem'
                }}>
                    <div className="game-stat-box">
                        <div className="game-stat-label">Total Winnings</div>
                        <div className="game-stat-value" style={{ color: 'var(--color-success)' }}>
                            ${user?.totalWinnings?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div className="game-stat-box">
                        <div className="game-stat-label">Total Losses</div>
                        <div className="game-stat-value" style={{ color: 'var(--color-accent-blood)' }}>
                            ${user?.totalLosses?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div className="game-stat-box">
                        <div className="game-stat-label">Win/Loss Ratio</div>
                        <div className="game-stat-value" style={{ color: 'var(--color-accent-gold)' }}>
                            {user?.totalLosses ? (user.totalWinnings / user.totalLosses).toFixed(2) : (user?.totalWinnings ? '∞' : '0.00')}
                        </div>
                    </div>
                    <div className="game-stat-box">
                        <div className="game-stat-label">VIP Standing</div>
                        <div className="game-stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>
                            {(user?.totalWinnings || 0) > 10000000 ? 'Shadow King' :
                                (user?.totalWinnings || 0) > 1000000 ? 'High Roller' :
                                    (user?.totalWinnings || 0) > 100000 ? 'Regular' : 'Street Hustler'}
                        </div>
                    </div>
                </div>

                {/* Games Section */}
                <div style={{ marginBottom: '4rem' }}>
                    <h2 style={{ marginBottom: '2rem' }}>Den Floor</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        <GameCard
                            title="The Viper"
                            description="High stakes snake. Bet on your reach. One wrong turn and the House takes all."
                            image="🐍"
                            link="/game/snake"
                            available={true}
                        />
                        <GameCard
                            title="Seven Sins"
                            description="Dice from the pit. Roll for your soul or your fortune."
                            image="🎲"
                            link="/game/dice"
                            available={false}
                        />
                        <GameCard
                            title="Abyssal Wheel"
                            description="A roulette of shadows. Where will the void stop?"
                            image="⭕"
                            link="/game/roulette"
                            available={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
