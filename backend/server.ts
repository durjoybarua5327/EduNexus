import 'dotenv/config'; // Load env vars before any other imports
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initDatabase } from './src/lib/init';

console.log("Server starting...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    // Initialize Database
    // Initialize Database with Retry Logic
    let dbReady = false;
    while (!dbReady) {
        try {
            await initDatabase();
            dbReady = true;
        } catch (error) {
            console.error('❌ Database connection failed. Retrying in 5 seconds...', error instanceof Error ? error.message : error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
