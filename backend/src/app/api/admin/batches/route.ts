import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [rows] = await pool.query("SELECT * FROM Batch");
    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, departmentId } = await req.json();
    const id = 'batch-' + Date.now();

    try {
        await pool.query("INSERT INTO Batch (id, name, departmentId) VALUES (?, ?, ?)", [id, name, departmentId]);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }
}
