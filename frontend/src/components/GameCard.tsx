import React from 'react';
import { Link } from 'react-router-dom';

interface GameCardProps {
    title: string;
    description: string;
    image: string;
    link: string;
    available: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, image, link, available }) => {
    return (
        <Link to={available ? link : '#'} style={{ textDecoration: 'none' }}>
            <div className={`card ${!available ? 'disabled' : ''}`} style={{ cursor: available ? 'pointer' : 'not-allowed', opacity: available ? 1 : 0.5 }}>
                <div style={{
                    width: '100%',
                    height: '200px',
                    background: `linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    fontSize: '4rem',
                    borderBottom: '2px solid var(--color-border)'
                }}>
                    {image}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    {description}
                </p>
                {available ? (
                    <span className="btn btn-primary" style={{ display: 'inline-block' }}>
                        Play Now
                    </span>
                ) : (
                    <span style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                        Coming Soon...
                    </span>
                )}
            </div>
        </Link>
    );
};

export default GameCard;
