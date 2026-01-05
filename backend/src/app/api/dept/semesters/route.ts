import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { z } from "zod";

const SemesterSchema = z.object({
    name: z.string().min(1),
    departmentId: z.string()
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "departmentId required" }, { status: 400 });
        }

        const [semesters] = await pool.query<any[]>(
            "SELECT * FROM Semester WHERE departmentId = ? ORDER BY CAST(REGEXP_REPLACE(name, '[^0-9]', '') AS UNSIGNED) ASC",
            [departmentId]
        );

        return NextResponse.json(semesters);
    } catch (error) {
        console.error("Error fetching semesters:", error);
        return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, departmentId } = SemesterSchema.parse(body);

        // Check for duplicate semester in the same department
        const [existing] = await pool.query<any[]>(
            "SELECT id FROM Semester WHERE name = ? AND departmentId = ?",
            [name, departmentId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "Semester already exists in this department" }, { status: 409 });
        }

        const semesterId = `sem-${Date.now()}`;

        await pool.query(
            "INSERT INTO Semester (id, name, departmentId) VALUES (?, ?, ?)",
            [semesterId, name, departmentId]
        );

        return NextResponse.json({ id: semesterId, name, departmentId }, { status: 201 });
    } catch (error) {
        console.error("Error creating semester:", error);
        return NextResponse.json({ error: "Failed to create semester" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Semester ID required" }, { status: 400 });
        }

        await pool.query("DELETE FROM Semester WHERE id = ?", [id]);

        return NextResponse.json({ message: "Semester deleted" });
    } catch (error) {
        console.error("Error deleting semester:", error);
        return NextResponse.json({ error: "Failed to delete semester" }, { status: 500 });
    }
}
