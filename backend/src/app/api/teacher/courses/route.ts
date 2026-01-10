
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        // Allow Teachers and Admins (debug) to see this, but strictly it's for the logged in teacher
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // If query param userId provided and user is admin, allow viewing others?
        // keeping it simple: My Courses
        const teacherId = session.user.id;

        const [courses] = await pool.query<any[]>(`
            SELECT 
                c.*, 
                s.name as semesterName,
                d.name as departmentName
            FROM Course c
            LEFT JOIN Semester s ON c.semesterId = s.id
            LEFT JOIN Department d ON c.departmentId = d.id
            WHERE c.teacherId = ?
            ORDER BY s.name, c.name
        `, [teacherId]);

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Error fetching teacher courses:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
