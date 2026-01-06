
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        // Optional filters
        // const action = searchParams.get("action"); 

        if (!departmentId) {
            // If no departmentId, maybe return all logs if Super Admin? 
            // For now, enforce departmentId to be safe or just return error as per current pattern
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        // Fetch logs
        const [logs] = await pool.query<any[]>(`
            SELECT al.*, u.name as actorName, u.email as actorEmail
            FROM AuditLog al
            JOIN User u ON al.actorId = u.id
            WHERE u.departmentId = ?
            ORDER BY al.createdAt DESC
            LIMIT ? OFFSET ?
        `, [departmentId, limit, offset]);

        // Fetch total count for pagination
        const [countResult] = await pool.query<any[]>(`
            SELECT COUNT(*) as total
            FROM AuditLog al
            JOIN User u ON al.actorId = u.id
            WHERE u.departmentId = ?
        `, [departmentId]);

        const total = countResult[0].total;

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
