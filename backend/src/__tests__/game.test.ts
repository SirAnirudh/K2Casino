import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Game API', () => {
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        // Create a test user
        const user = await prisma.user.create({
            data: {
                username: 'gameuser',
                email: 'game@example.com',
                password: 'hashedpassword',
                bankBalance: 1000000
            }
        });

        userId = user.id;

        // Generate auth token
        const secret = process.env.JWT_SECRET || 'test-secret';
        authToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
    });

    afterAll(async () => {
        await prisma.gameSession.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        await prisma.$disconnect();
    });

    describe('POST /api/game/save-session', () => {
        it('should save game session with valid data', async () => {
            const response = await request(app)
                .post('/api/game/save-session')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    score: 150,
                    duration: 120
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Game session saved successfully');
            expect(response.body.gameSession).toHaveProperty('id');
            expect(response.body.gameSession.score).toBe(150);
            expect(response.body.gameSession.duration).toBe(120);
        });

        it('should reject unauthorized request', async () => {
            const response = await request(app)
                .post('/api/game/save-session')
                .send({
                    score: 100,
                    duration: 60
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Access token required');
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .post('/api/game/save-session')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                    score: 100,
                    duration: 60
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid or expired token');
        });

        it('should reject negative score', async () => {
            const response = await request(app)
                .post('/api/game/save-session')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    score: -10,
                    duration: 60
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Score and duration must be non-negative');
        });

        it('should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/game/save-session')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    score: 100
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Score and duration are required as numbers');
        });
    });

    describe('GET /api/game/leaderboard', () => {
        it('should return leaderboard', async () => {
            const response = await request(app)
                .get('/api/game/leaderboard');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('leaderboard');
            expect(Array.isArray(response.body.leaderboard)).toBe(true);
        });
    });
});
