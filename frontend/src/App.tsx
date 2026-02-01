import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SnakeGamePage from './pages/SnakeGamePage';
import './styles/index.css';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/game/snake"
                        element={
                            <ProtectedRoute>
                                <SnakeGamePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/home" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
