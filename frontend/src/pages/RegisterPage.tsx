import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(username, email, password);
            navigate('/home');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh', position: 'relative' }}>
            <div className="casino-glow"></div>
            <div className="card" style={{ maxWidth: '500px', width: '100%', zIndex: 1 }}>
                <h1 className="text-center">Serpent's Lair</h1>
                <p className="text-center mb-4" style={{ color: 'var(--color-accent-gold)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 700 }}>THE HIGH STAKE DEN</p>
                <h3 className="text-center mb-4" style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', textTransform: 'uppercase' }}>Face the Viper</h3>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose your name"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Register as Player'}
                    </button>
                </form>

                <p className="text-center mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Already a member?{' '}
                    <Link to="/login">Return to the lair</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
