
import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/lib/db';
import { logAudit } from '../src/lib/audit';

async function seed() {
    try {
        console.log("Seeding initial log...");
        const [rows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        if (rows.length > 0) {
            await logAudit('USER_UPDATED', rows[0].id, 'System Dashboard Initialized - Audit Logging Active', rows[0].id);
            console.log("✅ Seeding complete.");
        } else {
            console.log("❌ No super admin found");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
seed();
