
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get("batchId");

        if (!batchId) {
            return NextResponse.json({ error: "Batch ID required" }, { status: 400 });
        }

        // Fetch Students
        const [students] = await pool.query<any[]>(`
            SELECT u.id, u.name, u.email, u.role, u.image, u.isTopCR, sp.studentIdNo
            FROM User u
            JOIN StudentProfile sp ON u.id = sp.userId
            WHERE sp.batchId = ? AND (u.role = 'STUDENT' OR u.role = 'CR')
            ORDER BY u.name ASC
        `, [batchId]);

        // Fetch Teachers (linked via Courses -> Semester -> Batch)
        const [teachers] = await pool.query<any[]>(`
            SELECT DISTINCT u.id, u.name, u.email, u.role, u.image, 'Teacher' as studentIdNo
            FROM User u
            JOIN Course c ON u.id = c.teacherId
            JOIN Semester s ON c.semesterId = s.id
            JOIN Batch b ON s.id = (SELECT s2.id FROM Semester s2 WHERE s2.name = b.currentSemester AND s2.departmentId = b.departmentId)
            WHERE b.id = ? AND u.role = 'TEACHER'
        `, [batchId]);

        return NextResponse.json([...teachers, ...students]);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { studentId, action, departmentId, name, password, studentIdNo, isTopCR } = body;
        // action: 'PROMOTE' | 'REVOKE' | 'UPDATE_INFO' | 'TOGGLE_TOP_CR'

        if (!studentId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        if (action === 'UPDATE_INFO') {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Update User table
                let userUpdateQuery = "UPDATE User SET name = ?";
                const userUpdateParams: any[] = [name];

                if (password && password.trim() !== "") {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    userUpdateQuery += ", password = ?";
                    userUpdateParams.push(hashedPassword);
                }

                userUpdateQuery += " WHERE id = ?";
                userUpdateParams.push(studentId);

                await connection.query(userUpdateQuery, userUpdateParams);

                // Update StudentProfile table
                if (studentIdNo) {
                    await connection.query(
                        "UPDATE StudentProfile SET studentIdNo = ? WHERE userId = ?",
                        [studentIdNo, studentId]
                    );
                }

                await connection.commit();

                await logAudit('USER_UPDATED', 'system', `Updated details for ${studentId} in dept ${departmentId}`, studentId);

                connection.release();
                return NextResponse.json({ message: "Student details updated" });

            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        }

        if (action === 'TOGGLE_TOP_CR') {
            // Validate: Max 2 Top CRs per batch
            if (isTopCR) {  // If we're trying to make someone a Top CR
                const [rows] = await pool.query<any[]>(`
                    SELECT COUNT(*) as count FROM User u
                    JOIN StudentProfile sp ON u.id = sp.userId
                    WHERE sp.batchId = (SELECT batchId FROM StudentProfile WHERE userId = ?)
                    AND u.role = 'CR' AND u.isTopCR = TRUE
                `, [studentId]);

                if (rows[0].count >= 2) {
                    return NextResponse.json({ error: "Maximum 2 Top CRs allowed per batch" }, { status: 400 });
                }
            }

            await pool.query("UPDATE User SET isTopCR = ? WHERE id = ?", [isTopCR, studentId]);
            await logAudit('USER_UPDATED', 'system', `${isTopCR ? 'Assigned' : 'Removed'} Top CR status for ${studentId}`, studentId);

            return NextResponse.json({ message: "Top CR status updated" });
        }

        if (action === 'PROMOTE') {
            // Check limit
            const [rows] = await pool.query<any[]>(`
                SELECT COUNT(*) as count FROM User u
                JOIN StudentProfile sp ON u.id = sp.userId
                WHERE sp.batchId = (SELECT batchId FROM StudentProfile WHERE userId = ?)
                AND u.role = 'CR'
            `, [studentId]);

            if (rows[0].count >= 4) {
                return NextResponse.json({ error: "CR limit reached (Max 4)" }, { status: 400 });
            }
        }

        const newRole = action === 'PROMOTE' ? 'CR' : 'STUDENT';

        await pool.query("UPDATE User SET role = ? WHERE id = ?", [newRole, studentId]);

        await logAudit('USER_UPDATED', 'system', `${action === 'PROMOTE' ? 'Promoted' : 'Revoked'} CR status for ${studentId} in dept ${departmentId}`, studentId);

        return NextResponse.json({ message: "Role updated" });
    } catch (error) {
        console.error("Error updating CR status:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, studentIdNo, batchId, departmentId, role } = body;

        if (!name || !email || !password || !batchId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Check if email exists
            const [existing] = await connection.query<any[]>("SELECT id FROM User WHERE email = ?", [email]);
            if (existing.length > 0) {
                connection.release();
                return NextResponse.json({ error: "Email already exists" }, { status: 409 });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Use provided role or default to STUDENT
            const userRole = role === 'CR' ? 'CR' : 'STUDENT';

            await connection.query(
                "INSERT INTO User (id, name, email, password, role, departmentId) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, name, email, hashedPassword, userRole, departmentId]
            );

            const studentProfileId = `sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await connection.query(
                "INSERT INTO StudentProfile (id, userId, batchId, studentIdNo) VALUES (?, ?, ?, ?)",
                [studentProfileId, userId, batchId, studentIdNo || '']
            );

            await connection.commit();

            // Audit logic can be refined to detect who is acting, but for now we log system action or we can pass actorId
            await logAudit('USER_CREATED', 'system', `Created ${userRole} ${name} in batch ${batchId}`, userId);

            connection.release();
            return NextResponse.json({ message: "Student created", id: userId }, { status: 201 });

        } catch (e) {
            await connection.rollback();
            connection.release();
            throw e;
        }

    } catch (error: any) {
        console.error("Error creating student:", error);
        return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
    }
}
