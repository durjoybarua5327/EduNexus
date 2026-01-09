
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const CourseSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    semesterId: z.string().optional(),
    teacherId: z.string().optional(),
    credits: z.number().min(0.5).max(6).optional().default(3),
    actorId: z.string().optional()
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");
        const semesterId = searchParams.get("semesterId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        let query = `
            SELECT c.*, u.name as teacherName, s.name as semesterName
            FROM Course c
            LEFT JOIN User u ON c.teacherId = u.id
            LEFT JOIN Semester s ON c.semesterId = s.id
            WHERE c.departmentId = ?
        `;
        const params: any[] = [departmentId];

        if (semesterId) {
            query += " AND c.semesterId = ?";
            params.push(semesterId);
        }

        query += " ORDER BY c.code ASC";

        const [courses] = await pool.query<any[]>(query, params);

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = CourseSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, code, semesterId, teacherId, credits, actorId } = parsed.data;
        const id = "crs-" + Date.now();

        await pool.query(
            "INSERT INTO Course (id, name, code, semesterId, departmentId, teacherId, credits) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, name, code, semesterId || null, departmentId, teacherId || null, credits]
        );

        await logAudit('COURSE_CREATED', actorId || 'system', `Created course ${code} - ${name} in dept ${departmentId}`, id);

        return NextResponse.json({ message: "Course created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: "Course ID required" }, { status: 400 });

        const parsed = CourseSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, code, semesterId, teacherId, credits, actorId } = parsed.data;

        await pool.query(
            "UPDATE Course SET name = ?, code = ?, semesterId = ?, teacherId = ?, credits = ? WHERE id = ?",
            [name, code, semesterId || null, teacherId || null, credits, id]
        );

        await logAudit('COURSE_UPDATED', actorId || 'system', `Updated course ${code} - ${name}`, id);

        return NextResponse.json({ message: "Course updated" });
    } catch (error) {
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM Course WHERE id = ?", [id]);
        await logAudit('COURSE_DELETED', 'system', `Deleted course ${id}`, id);

        return NextResponse.json({ message: "Course deleted" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
