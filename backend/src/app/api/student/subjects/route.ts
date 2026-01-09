
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");
        const semester = searchParams.get("semester");

        if (!departmentId || !semester) {
            return NextResponse.json({ error: "Missing departmentId or semester" }, { status: 400 });
        }

        // We first need to find the semester ID from the semester Name (e.g. "1st") if your DB structure uses IDs.
        // Assuming 'Semester' table has a 'name' column like "1st", "2nd". 
        // Or if Course table has a direct 'semesterId', we need to resolve it.
        // Let's assume we join with Semester table.

        const [courses] = await pool.query<any[]>(`
            SELECT c.*, u.name as teacherName 
            FROM Course c
            LEFT JOIN User u ON c.teacherId = u.id
            JOIN Semester s ON c.semesterId = s.id
            WHERE c.departmentId = ? AND s.name = ?
            ORDER BY c.code ASC
        `, [departmentId, semester]);

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
    }
}
