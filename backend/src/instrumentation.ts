import { initDatabase } from './lib/init';

export async function register() {
    let dbReady = false;
    while (!dbReady) {
        try {
            await initDatabase();
            dbReady = true;
        } catch (error) {
            console.error('Database connection failed. Retrying in 5 seconds...', error instanceof Error ? error.message : error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
