import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Registration request body:', req.body);
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            console.log('Validation failed: Missing fields');
            res.status(400).json({ error: 'Username, email, and password are required' });
            return;
        }

        if (password.length < 6) {
            console.log('Validation failed: Password too short');
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Check if user already exists
        console.log('Checking if user exists...');
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            console.log('User already exists');
            if (existingUser.username === username) {
                res.status(409).json({ error: 'Username already taken' });
                return;
            }
            if (existingUser.email === email) {
                res.status(409).json({ error: 'Email already registered' });
                return;
            }
        }

        // Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        console.log('Creating user in database...');
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                bankBalance: 1000000 // Starting balance
            },
            select: {
                id: true,
                username: true,
                email: true,
                bankBalance: true,
                createdAt: true
            }
        });

        console.log('User created successfully:', user.id);
        res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error: any) {
        console.error('Registration error details:', error);

        // Handle Prisma unique constraint violations (P2002)
        if (error.code === 'P2002') {
            const targets = (error.meta?.target as string[]) || [];
            if (targets.includes('username')) {
                res.status(409).json({ error: 'Username already taken' });
                return;
            }
            if (targets.includes('email')) {
                res.status(409).json({ error: 'Email already registered' });
                return;
            }
            res.status(409).json({ error: 'User already exists' });
            return;
        }

        res.status(500).json({
            error: 'Failed to register user',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id },
            secret,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                bankBalance: user.bankBalance
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};
