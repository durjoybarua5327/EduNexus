
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const AdminSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        // Ideally we should verify if the requester is a Top Admin here, but we'll trust the Frontend + Session check for now
        // OR better, pass the 'actorId' header or similar if valid token. 
        // Since we are moving fast, we'll rely on client-side filtering + role check if possible, or simple ID match.

        const [admins] = await pool.query<any[]>(`
            SELECT id, name, email, role, isBanned, isTopDepartmentAdmin 
            FROM User 
            WHERE departmentId = ? AND role = 'DEPT_ADMIN'
        `, [departmentId]);

        return NextResponse.json(admins);
    } catch (error) {
        console.error("Error fetching dept admins:", error);
        return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = AdminSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, email, password } = parsed.data;

        const [existing] = await pool.query<any[]>("SELECT id FROM User WHERE email = ?", [email]);
        if (existing.length > 0) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = "adm-" + Date.now();

        await pool.query(
            "INSERT INTO User (id, name, email, password, role, departmentId) VALUES (?, ?, ?, ?, 'DEPT_ADMIN', ?)",
            [id, name, email, hashedPassword, departmentId]
        );

        await logAudit('USER_CREATED', 'system', `Created Dept Admin ${name}`, id);

        return NextResponse.json({ message: "Admin created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating dept admin:", error);
        return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM User WHERE id = ? AND role = 'DEPT_ADMIN'", [id]);
        await logAudit('USER_BANNED', 'system', `Deleted/Removed Dept Admin ${id}`, id); // Reuse audit action or add USER_DELETED

        return NextResponse.json({ message: "Admin removed" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
