
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const TeacherSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    designation: z.string().optional(),
    phone: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, tp.designation, tp.contactInfo as phone, u.isBanned
            FROM User u
            LEFT JOIN TeacherProfile tp ON u.id = tp.userId
            WHERE u.departmentId = ? AND u.role = 'TEACHER'
            ORDER BY u.name ASC
        `, [departmentId]);

        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching faculty:", error);
        return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = TeacherSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, email, password, designation, phone } = parsed.data;

        // Check email
        const [existing] = await pool.query<any[]>("SELECT id FROM User WHERE email = ?", [email]);
        if (existing.length > 0) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = "usr-" + Date.now();
        const profileId = "tp-" + Date.now();

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                "INSERT INTO User (id, name, email, password, role, departmentId) VALUES (?, ?, ?, ?, 'TEACHER', ?)",
                [userId, name, email, hashedPassword, departmentId]
            );

            await connection.query(
                "INSERT INTO TeacherProfile (id, userId, designation, contactInfo) VALUES (?, ?, ?, ?)",
                [profileId, userId, designation || "Lecturer", phone || ""]
            );

            await connection.commit();

            // Audit (using userId as actor for now, ideally dept admin's ID)
            await logAudit('USER_CREATED', 'system', `Created faculty ${name} in dept ${departmentId}`, userId);

            connection.release();
            return NextResponse.json({ message: "Faculty created" }, { status: 201 });
        } catch (e) {
            await connection.rollback();
            connection.release();
            throw e;
        }

    } catch (error) {
        console.error("Error creating faculty:", error);
        return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, action, departmentId, ...data } = body;

        if (!id || !departmentId) return NextResponse.json({ error: "ID required" }, { status: 400 });

        if (action === 'TOGGLE_BAN') {
            const { isBanned } = data;
            await pool.query("UPDATE User SET isBanned = ? WHERE id = ?", [isBanned, id]);
            await logAudit(isBanned ? 'USER_BANNED' : 'USER_UNBANNED', 'system', `${isBanned ? 'Banned' : 'Unbanned'} faculty ${id}`, id);
            return NextResponse.json({ message: "Status updated" });
        }

        if (action === 'UPDATE_PROFILE') {
            const { name, email, designation, phone } = data;

            const connection = await pool.getConnection();
            await connection.beginTransaction();
            try {
                await connection.query("UPDATE User SET name = ?, email = ? WHERE id = ?", [name, email, id]);
                await connection.query("UPDATE TeacherProfile SET designation = ?, contactInfo = ? WHERE userId = ?", [designation, phone, id]);
                await connection.commit();
                await logAudit('USER_UPDATED', 'system', `Updated faculty ${name}`, id);
                connection.release();
                return NextResponse.json({ message: "Profile updated" });
            } catch (e) {
                await connection.rollback();
                connection.release();
                throw e;
            }
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Error updating faculty:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
