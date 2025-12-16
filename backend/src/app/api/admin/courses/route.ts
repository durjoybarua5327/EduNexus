import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [rows] = await pool.query("SELECT * FROM Course");
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code, teacherId } = await req.json();
    const id = 'course-' + Date.now();

    try {
        await pool.query(
            "INSERT INTO Course (id, name, code, teacherId) VALUES (?, ?, ?, ?)",
            [id, name, code, teacherId]
        );
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
