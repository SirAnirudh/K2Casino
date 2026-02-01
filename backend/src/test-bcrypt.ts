import bcrypt from 'bcrypt';

async function main() {
    try {
        console.log('Testing bcrypt...');
        const password = 'password123';
        const saltRounds = 10;

        console.log('Hashing password...');
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Hash generated successfully:', hash);

        console.log('Verifying password...');
        const isMatch = await bcrypt.compare(password, hash);
        console.log('Bcrypt verification successful:', isMatch);

        if (isMatch) {
            console.log('Bcrypt test PASSED!');
        } else {
            console.log('Bcrypt test FAILED!');
        }
    } catch (error) {
        console.error('Bcrypt test failed with error:', error);
    }
}

main();
