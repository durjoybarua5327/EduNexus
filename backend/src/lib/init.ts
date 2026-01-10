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
        startMonth VARCHAR(50),
        currentSemester VARCHAR(50),
        semesterDuration VARCHAR(50), 
        lastPromotionDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist (Migration)
    try { await db.query("ALTER TABLE Batch ADD COLUMN startMonth VARCHAR(50)"); console.log("✅ Added startMonth to Batch"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding startMonth:", e); }
    try { await db.query("ALTER TABLE Batch ADD COLUMN currentSemester VARCHAR(50)"); console.log("✅ Added currentSemester to Batch"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding currentSemester:", e); }
    try { await db.query("ALTER TABLE Batch ADD COLUMN semesterDuration VARCHAR(50)"); console.log("✅ Added semesterDuration to Batch"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding semesterDuration:", e); }
    try { await db.query("ALTER TABLE Batch ADD COLUMN lastPromotionDate DATETIME"); console.log("✅ Added lastPromotionDate to Batch"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding lastPromotionDate:", e); }

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

    try {
      await db.query("ALTER TABLE User ADD COLUMN isTopCR BOOLEAN DEFAULT FALSE");
      console.log("✅ Added isTopCR to User");
    } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.log("ℹ️  isTopCR column already exists"); }


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
      CREATE TABLE IF NOT EXISTS Semester (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        departmentId VARCHAR(191) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS Course (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        code VARCHAR(191),
        credits INT DEFAULT 3,
        semesterId VARCHAR(191),
        departmentId VARCHAR(191),
        teacherId VARCHAR(191),
        FOREIGN KEY (semesterId) REFERENCES Semester(id) ON DELETE CASCADE,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE,
        FOREIGN KEY (teacherId) REFERENCES User(id) ON DELETE SET NULL
      )
    `);

    // Ensure credits column exists (for existing databases)
    try {
      await db.query("ALTER TABLE Course ADD COLUMN credits INT DEFAULT 3");
      console.log("✅ Added credits to Course");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding credits:", e);
    }

    // Migration: Add semesterId column if it doesn't exist
    try {
      await db.query("ALTER TABLE Course ADD COLUMN semesterId VARCHAR(191)");
      console.log("✅ Added semesterId to Course");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding semesterId:", e);
    }

    // Migration: Add FK constraint if not exists
    try {
      await db.query(`
        ALTER TABLE Course 
        ADD CONSTRAINT fk_course_semester 
        FOREIGN KEY (semesterId) REFERENCES Semester(id) ON DELETE CASCADE
      `);
      console.log("✅ Added FK constraint for semesterId");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_KEYNAME') console.error("Error adding FK:", e);
    }

    // Seed default semesters for existing departments (REMOVED: User requested no dummy data)
    /*
    const [departments] = await db.query<any[]>('SELECT id FROM Department');
    for (const dept of departments) {
      const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
      for (const sem of semesters) {
        const semId = `sem-${dept.id}-${sem}`;
        await db.query(
          'INSERT IGNORE INTO Semester (id, name, departmentId) VALUES (?, ?, ?)',
          [semId, sem, dept.id]
        );
      }
    }
    console.log("✅ Default semesters seeded");
    */


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
        description LONGTEXT,
        priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
        expiryDate DATETIME,
        departmentId VARCHAR(191),
        isPinned BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
      )
    `);

    // Ensure description is LONGTEXT to hold rich text
    try { await db.query("ALTER TABLE Notice MODIFY description LONGTEXT"); } catch (e: any) { }

    await db.query(`
      CREATE TABLE IF NOT EXISTS Tag (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) UNIQUE NOT NULL
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS NoticeTag (
        noticeId VARCHAR(191),
        tagId VARCHAR(191),
        PRIMARY KEY (noticeId, tagId),
        FOREIGN KEY (noticeId) REFERENCES Notice(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ClassNotice (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(191) NOT NULL,
        description LONGTEXT,
        priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
        batchId VARCHAR(191) NOT NULL,
        authorId VARCHAR(191) NOT NULL,
        isPinned BOOLEAN DEFAULT FALSE,
        expiryDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batchId) REFERENCES Batch(id) ON DELETE CASCADE,
        FOREIGN KEY (authorId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

    // Ensure expiryDate exists
    try { await db.query("ALTER TABLE ClassNotice ADD COLUMN expiryDate DATETIME"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    await db.query(`
      CREATE TABLE IF NOT EXISTS ClassNoticeTag (
        noticeId VARCHAR(191),
        tagId VARCHAR(191),
        PRIMARY KEY (noticeId, tagId),
        FOREIGN KEY (noticeId) REFERENCES ClassNotice(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE
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
        isSystem BOOLEAN DEFAULT FALSE,
        allowUploads ENUM('ONLY_ME', 'ANYONE') DEFAULT 'ONLY_ME',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (parentId) REFERENCES Folder(id) ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES Course(id) ON DELETE CASCADE
      )
    `);

    // Ensure isSystem column exists
    try { await db.query("ALTER TABLE Folder ADD COLUMN isSystem BOOLEAN DEFAULT FALSE"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    await db.query(`
      CREATE TABLE IF NOT EXISTS File (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        url VARCHAR(191) NOT NULL,
        folderId VARCHAR(191) NOT NULL,
        type VARCHAR(191),
        size INT,
        isPublic BOOLEAN DEFAULT FALSE,
        uploadedBy VARCHAR(191),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folderId) REFERENCES Folder(id) ON DELETE CASCADE,
        FOREIGN KEY (uploadedBy) REFERENCES User(id) ON DELETE SET NULL
      )
    `);

    // Ensure isPublic column exists directly in File
    try { await db.query("ALTER TABLE File ADD COLUMN isPublic BOOLEAN DEFAULT FALSE"); } catch (e: any) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }

    console.log('✅ Tables initialized successfully.');

    // Seed Super Admin if not exists
    // Seed Super Admin if not exists
    const targetEmail = 'durjoybarua8115@gmail.com';
    const systemId = 'system';

    // Seed System User
    const [existingSystem] = await db.query<any[]>('SELECT * FROM User WHERE id = ?', [systemId]);
    if (existingSystem.length === 0) {
      console.log('Seeding System User...');
      const hashedPassword = await bcrypt.hash('system-password-should-be-long', 10);
      await db.query(
        'INSERT INTO User (id, name, email, password, role, isBanned) VALUES (?, ?, ?, ?, ?, ?)',
        [systemId, 'System', 'system@edunexus.local', hashedPassword, 'SUPER_ADMIN', false]
      );
      console.log('✅ System User created');
    }

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
