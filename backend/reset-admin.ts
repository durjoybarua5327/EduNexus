
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function resetAdmin() {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/edunexus';
    console.log('Connecting to:', dbUrl);

    const connection = await mysql.createConnection(dbUrl);

    const email = 'durjoybarua8115@gmail.com';
    const password = '53278753905678';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const [rows] = await connection.query<any[]>('SELECT * FROM User WHERE email = ?', [email]);

    if (rows.length > 0) {
        console.log(`User ${email} found. Updating password...`);
        await connection.query('UPDATE User SET password = ? WHERE email = ?', [hashedPassword, email]);
        console.log('✅ Password updated successfully.');
    } else {
        console.log(`User ${email} NOT found. Creating...`);
        const adminId = 'super-admin-' + Date.now();

        // Ensure dependencies
        await connection.query('INSERT IGNORE INTO University (id, name, location) VALUES (?, ?, ?)', ['uni-001', 'EduNexus University', 'Global']);
        await connection.query('INSERT IGNORE INTO Department (id, name, universityId) VALUES (?, ?, ?)', ['dept-001', 'Computer Science', 'uni-001']);

        await connection.query(
            'INSERT INTO User (id, name, email, password, role, departmentId) VALUES (?, ?, ?, ?, ?, ?)',
            [adminId, 'Super Admin', email, hashedPassword, 'SUPER_ADMIN', 'dept-001']
        );
        console.log('✅ User created successfully.');
    }

    await connection.end();
}

resetAdmin().catch(console.error);
