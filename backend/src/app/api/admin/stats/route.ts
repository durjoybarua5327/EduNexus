import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (session?.user?.role !== 'DEPT_ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [studentRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE role = 'STUDENT'");
    const [teacherRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE role = 'TEACHER'");
    const [batchRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Batch");
    const [courseRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Course");

    return NextResponse.json({
        students: studentRows[0].count,
        teachers: teacherRows[0].count,
        batches: batchRows[0].count,
        courses: courseRows[0].count
    });
}
