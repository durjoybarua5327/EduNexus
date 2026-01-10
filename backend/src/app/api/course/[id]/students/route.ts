
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: courseId } = await params;

        // 1. Get Course Details to find Department and Semester
        const [courses] = await pool.query<any[]>(
            `SELECT c.departmentId, c.semesterId, s.name as semesterName 
             FROM Course c
             LEFT JOIN Semester s ON c.semesterId = s.id
             WHERE c.id = ?`,
            [courseId]
        );

        if (!courses || courses.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const course = courses[0];

        if (!course.departmentId || !course.semesterName) {
            // If course doesn't have department/semester linked correctly, return empty list
            return NextResponse.json([]);
        }

        // 2. Fetch Students matching Dept and Semester (via Batch)
        const [students] = await pool.query<any[]>(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.image, 
                sp.studentIdNo,
                b.name as batchName
            FROM StudentProfile sp
            JOIN User u ON sp.userId = u.id
            JOIN Batch b ON sp.batchId = b.id
            WHERE u.departmentId = ? 
            AND b.currentSemester = ?
            ORDER BY sp.studentIdNo ASC
        `, [course.departmentId, course.semesterName]);

        return NextResponse.json(students);

    } catch (error) {
        console.error("Error fetching course students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
