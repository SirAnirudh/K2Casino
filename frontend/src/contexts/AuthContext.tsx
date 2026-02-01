import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from '../api/client';

interface User {
    id: string;
    username: string;
    email: string;
    bankBalance: number;
    totalWinnings: number;
    totalLosses: number;
    gameSessions?: any[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            loadUserProfile();
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadUserProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to load profile:', error);
            localStorage.removeItem('authToken');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await authAPI.login(email, password);
        const { token, user: userData } = response.data;

        localStorage.setItem('authToken', token);
        setUser(userData);
    };

    const register = async (username: string, email: string, password: string) => {
        await authAPI.register(username, email, password);
        // After registration, automatically log in
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

    const refreshProfile = async () => {
        await loadUserProfile();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
