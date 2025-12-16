import mysql from 'mysql2/promise';
import pool from './db';
import bcrypt from 'bcryptjs';

export async function initDatabase() {
  try {
    console.log('INIT: Starting database initialization...');

    const dbUrl = process.env.DATABASE_URL;
    console.log('INIT: DB URL found:', !!dbUrl);

    if (!dbUrl) throw new Error("DATABASE_URL not found");

    // Parse URL to get connection details
    let host, port, user, password, database;
    try {
      const urlParts = new URL(dbUrl);
      host = urlParts.hostname;
      port = parseInt(urlParts.port) || 3306;
      user = urlParts.username;
      password = urlParts.password;
      database = urlParts.pathname.substring(1);
    } catch (e) {
      const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (match) {
        [, user, password, host, port, database] = match;
      }
    }

    if (!host || !user || !database) {
      console.error("Invalid DATABASE_URL format.");
      throw new Error("Invalid DATABASE_URL");
    }

    // 1. Connect without database to create it
    const connectionConfig = {
      host: host!,
      port: port as number,
      user: user!,
      password: password
    };
    const connection = await mysql.createConnection(connectionConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`✅ Database '${database}' ready.`);
    await connection.end();

    // 2. Use the pool to create tables
    const db = await pool.getConnection();

    // --- Global Hierarchy ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS University (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        location VARCHAR(191),
        isBanned BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure column exists
    try { await db.query("ALTER TABLE University ADD COLUMN isBanned BOOLEAN DEFAULT FALSE"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    try { await db.query("ALTER TABLE University ADD COLUMN location VARCHAR(191)"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    await db.query(`
      CREATE TABLE IF NOT EXISTS Department (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        universityId VARCHAR(191),
        isBanned BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (universityId) REFERENCES University(id) ON DELETE CASCADE
      )
    `);

    // Ensure column exists
    try { await db.query("ALTER TABLE Department ADD COLUMN isBanned BOOLEAN DEFAULT FALSE"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }




    await db.query(`
      CREATE TABLE IF NOT EXISTS Batch (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        departmentId VARCHAR(191) NOT NULL,
        year INT,
        section VARCHAR(50),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
      )
    `);

    // --- Users & Roles ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(191) NOT NULL,
        role ENUM('SUPER_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT', 'CR') DEFAULT 'STUDENT',
        departmentId VARCHAR(191),
        image VARCHAR(191),
        isBanned BOOLEAN DEFAULT FALSE,
        banExpiresAt DATETIME,
        isTopDepartmentAdmin BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE SET NULL
      )
    `);

    // Ensure columns exist for existing databases
    try {
      await db.query("ALTER TABLE User ADD COLUMN isBanned BOOLEAN DEFAULT FALSE");
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    try {
      await db.query("ALTER TABLE User ADD COLUMN banExpiresAt DATETIME");
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    try {
      await db.query("ALTER TABLE User ADD COLUMN isTopDepartmentAdmin BOOLEAN DEFAULT FALSE");
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    // --- Audit Logs (Placed after User for FK) ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS AuditLog (
        id VARCHAR(191) PRIMARY KEY,
        action VARCHAR(191) NOT NULL,
        actorId VARCHAR(191) NOT NULL,
        targetId VARCHAR(191),
        details TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actorId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS StudentProfile (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) UNIQUE NOT NULL,
        batchId VARCHAR(191),
        studentIdNo VARCHAR(191),
        totalUploads INT DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (batchId) REFERENCES Batch(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS TeacherProfile (
        id VARCHAR(191) PRIMARY KEY,
        userId VARCHAR(191) UNIQUE NOT NULL,
        designation VARCHAR(191),
        officeHours VARCHAR(191),
        contactInfo VARCHAR(191),
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

    // --- Academics ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS Course (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        code VARCHAR(191),
        semester VARCHAR(191),
        departmentId VARCHAR(191),
        teacherId VARCHAR(191),
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE,
        FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS Routine (
        id VARCHAR(191) PRIMARY KEY,
        batchId VARCHAR(191) NOT NULL,
        type ENUM('CLASS', 'EXAM') NOT NULL,
        content TEXT,
        url VARCHAR(191),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batchId) REFERENCES Batch(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS Notice (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description TEXT,
        priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
        expiryDate DATETIME,
        departmentId VARCHAR(191),
        isPinned BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
      )
    `);

    // --- Content ---
    await db.query(`
      CREATE TABLE IF NOT EXISTS Folder (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        parentId VARCHAR(191),
        ownerId VARCHAR(191) NOT NULL,
        courseId VARCHAR(191),
        isPublic BOOLEAN DEFAULT FALSE,
        allowUploads ENUM('ONLY_ME', 'ANYONE') DEFAULT 'ONLY_ME',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Folder(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS File (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        url VARCHAR(191) NOT NULL,
        folderId VARCHAR(191) NOT NULL,
        type VARCHAR(191),
        size INT,
        uploadedBy VARCHAR(191),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folderId) REFERENCES Folder(id) ON DELETE CASCADE,
        FOREIGN KEY (uploadedBy) REFERENCES User(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Tables initialized successfully.');

    // Seed Super Admin if not exists
    // Seed Super Admin if not exists
    const targetEmail = 'durjoybarua8115@gmail.com';
    const [existingAdmin] = await db.query<any[]>('SELECT * FROM User WHERE email = ?', [targetEmail]);

    if (existingAdmin.length === 0) {
      console.log('Seeding Super Admin...');
      // Password provided: 53278753905678
      const hashedPassword = await bcrypt.hash('53278753905678', 10);
      const adminId = 'super-admin-' + Date.now();

      // Ensure dummy university exists for seed
      const uniId = 'uni-001';
      await db.query('INSERT IGNORE INTO University (id, name, location) VALUES (?, ?, ?)', [uniId, 'EduNexus University', 'Global']);
      const deptId = 'dept-001';
      await db.query('INSERT IGNORE INTO Department (id, name, universityId) VALUES (?, ?, ?)', [deptId, 'Computer Science', uniId]);

      await db.query(
        'INSERT INTO User (id, name, email, password, role, departmentId) VALUES (?, ?, ?, ?, ?, ?)',
        [adminId, 'Super Admin', targetEmail, hashedPassword, 'SUPER_ADMIN', deptId]
      );
      console.log(`✅ Super Admin created: ${targetEmail}`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${targetEmail}`);
    }

    db.release();

  } catch (error: any) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n❌ CRITICAL ERROR: Access Denied to MySQL Database.');
      console.error('----------------------------------------------------');
      console.error('Please verify your credentials in backend/.env');
      console.error('Current configuration trying to connect as:', process.env.DATABASE_URL?.split('@')[0].split('//')[1]);
      console.error('----------------------------------------------------');
      throw error;
    } else {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
}
