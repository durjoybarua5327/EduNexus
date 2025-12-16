
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const DepartmentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    universityId: z.string().min(1, "University ID is required"),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const universityId = searchParams.get("universityId");

        let query = `
            SELECT 
                d.*, 
                u.name as universityName,
                (SELECT COUNT(*) FROM User WHERE departmentId = d.id AND role = 'DEPT_ADMIN') as adminCount,
                (SELECT COUNT(*) FROM User WHERE departmentId = d.id AND role = 'STUDENT') as studentCount,
                (SELECT COUNT(*) FROM User WHERE departmentId = d.id AND role = 'TEACHER') as facultyCount
            FROM Department d 
            LEFT JOIN University u ON d.universityId = u.id
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (id) {
            conditions.push("d.id = ?");
            params.push(id);
        }

        if (universityId) {
            conditions.push("d.universityId = ?");
            params.push(universityId);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY d.createdAt DESC";

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = DepartmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
        }

        const { name, universityId } = parsed.data;
        const id = "dept-" + Date.now();

        await pool.query(
            "INSERT INTO Department (id, name, universityId) VALUES (?, ?, ?)",
            [id, name, universityId]
        );

        // Audit Log
        const [adminRows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        const actorId = adminRows[0]?.id || 'system';
        await logAudit('DEPARTMENT_CREATED', actorId, `Created department ${name} for university ${universityId}`, id);

        return NextResponse.json({ message: "Department created", id }, { status: 201 });
    } catch (error) {
        console.error("Error creating department:", error);
        return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, isBanned } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (name) { updates.push("name = ?"); params.push(name); }
        if (isBanned !== undefined) { updates.push("isBanned = ?"); params.push(isBanned); }

        if (updates.length === 0) return NextResponse.json({ message: "No changes" });
        params.push(id);

        await pool.query(`UPDATE Department SET ${updates.join(", ")} WHERE id = ?`, params);

        // Audit Log
        const [adminRows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        const actorId = adminRows[0]?.id || 'system';

        if (name) {
            await logAudit('DEPARTMENT_RENAMED', actorId, `Renamed department ${id} to ${name}`, id);
        }

        return NextResponse.json({ message: "Department updated" });
    } catch (error) {
        console.error("Error updating department:", error);
        return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await pool.query("DELETE FROM Department WHERE id = ?", [id]);

        // Audit Log
        const [adminRows] = await pool.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
        const actorId = adminRows[0]?.id || 'system';
        await logAudit('DEPARTMENT_DELETED', actorId, `Deleted department ${id}`, id);

        return NextResponse.json({ message: "Department deleted" });
    } catch (error) {
        console.error("Error deleting department:", error);
        return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
    }
}
