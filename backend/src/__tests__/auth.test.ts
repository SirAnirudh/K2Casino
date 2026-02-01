import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server';

const prisma = new PrismaClient();

describe('Authentication API', () => {
    beforeAll(async () => {
        // Clean up test data
        await prisma.gameSession.deleteMany({});
        await prisma.user.deleteMany({});
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with correct initial balance', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.username).toBe('testuser');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.bankBalance).toBe(1000000);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should reject duplicate username', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'another@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Username already taken');
        });

        it('should reject duplicate email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'anotheruser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already registered');
        });

        it('should reject short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: '12345'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Password must be at least 6 characters');
        });

        it('should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'incomplete'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Username, email, and password are required');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials and return JWT', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.username).toBe('testuser');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should reject missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Email and password are required');
        });
    });
});
