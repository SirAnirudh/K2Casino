import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    register: (username: string, email: string, password: string) =>
        api.post('/api/auth/register', { username, email, password }),

    login: (email: string, password: string) =>
        api.post('/api/auth/login', { email, password }),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/api/user/profile'),

    getGameHistory: (limit = 10, offset = 0) =>
        api.get('/api/user/game-history', { params: { limit, offset } }),
};

// Game API
export const gameAPI = {
    saveSession: (
        score: number,
        duration: number,
        betAmount: number = 0,
        targetScore: number = 0,
        timeTarget: number = 0,
        survivalTarget: number = 0,
        clicksTarget: number = 0,
        speed: string = 'NORMAL',
        clicksUsed: number = 0,
        isDoubleOrNothing: boolean = false
    ) =>
        api.post('/api/game/save-session', {
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
        }),

    getLeaderboard: (limit = 10) =>
        api.get('/api/game/leaderboard', { params: { limit } }),
};

export default api;
