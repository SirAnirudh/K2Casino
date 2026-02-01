import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection...');
        const count = await prisma.user.count();
        console.log('User count:', count);

        console.log('Attempting to create a test user...');
        const testUser = await prisma.user.create({
            data: {
                username: 'testuser_' + Date.now(),
                email: 'test_' + Date.now() + '@example.com',
                password: 'password123',
                bankBalance: 1000000
            }
        });
        console.log('Created test user:', testUser.id);

        console.log('Deleting test user...');
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
