import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Course ID required" }, { status: 400 });
        }

        const [courses] = await pool.query<any[]>(
            `SELECT c.id, c.name, c.code, c.credits, c.departmentId, c.semesterId,
                    u.name as teacherName, s.name as semesterName, d.name as departmentName
             FROM Course c
             LEFT JOIN User u ON c.teacherId = u.id
             LEFT JOIN Semester s ON c.semesterId = s.id
             LEFT JOIN Department d ON c.departmentId = d.id
             WHERE c.id = ?`,
            [id]
        );

        if (!courses || courses.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(courses[0]);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }
}
