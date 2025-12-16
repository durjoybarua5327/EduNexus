import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rows] = await pool.query("SELECT * FROM User WHERE role = 'TEACHER' ORDER BY name ASC");
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, email, password, role } = data;

    if (!email || !password || !name || !role) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Date.now().toString(); // Simple ID generation

    try {
        await pool.query(
            "INSERT INTO User (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            [id, name, email, hashedPassword, role]
        );

        if (role === 'TEACHER') {
            await pool.query("INSERT INTO TeacherProfile (id, userId) VALUES (?, ?)", [Date.now().toString(), id]);
        } else if (role === 'STUDENT') {
            await pool.query("INSERT INTO StudentProfile (id, userId, batchId, studentIdNo) VALUES (?, ?, ?, ?)", [Date.now().toString(), id, 'PENDING_BATCH', 'TBD']);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "User already exists or database error" }, { status: 500 });
    }
}
