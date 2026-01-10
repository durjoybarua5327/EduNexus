import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 50, // Optimize for higher concurrency (1000+ users)
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

export default pool;
