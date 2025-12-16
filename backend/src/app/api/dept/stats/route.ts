
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        const [studentCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE departmentId = ? AND role = 'STUDENT'", [departmentId]);
        const [facultyCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM User WHERE departmentId = ? AND role = 'TEACHER'", [departmentId]);
        const [courseCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Course WHERE departmentId = ?", [departmentId]);
        const [batchCounts] = await pool.query<any[]>("SELECT COUNT(*) as count FROM Batch WHERE departmentId = ?", [departmentId]);

        // Recent Activity for this Dept
        // We can filter AuditLog by targetId matching deptId OR actor in this dept. 
        // For simplicity, let's fetch logs where actor is in this dept.
        const [logs] = await pool.query<any[]>(`
            SELECT al.*, u.name as actorName 
            FROM AuditLog al
            JOIN User u ON al.actorId = u.id
            WHERE u.departmentId = ?
            ORDER BY al.createdAt DESC LIMIT 5
        `, [departmentId]);

        return NextResponse.json({
            students: studentCounts[0].count,
            faculty: facultyCounts[0].count,
            courses: courseCounts[0].count,
            batches: batchCounts[0].count,
            recentActivity: logs
        });
    } catch (error) {
        console.error("Error fetching dept stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
