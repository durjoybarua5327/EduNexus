
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const NoticeSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    expiryDate: z.string().optional(),
    isPinned: z.boolean().default(false)
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        const [notices] = await pool.query<any[]>(`
            SELECT * FROM Notice 
            WHERE departmentId = ? 
            ORDER BY isPinned DESC, createdAt DESC
        `, [departmentId]);

        return NextResponse.json(notices);
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = NoticeSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { title, description, priority, expiryDate, isPinned } = parsed.data;
        const id = "not-" + Date.now();

        await pool.query(
            "INSERT INTO Notice (id, title, description, priority, expiryDate, isPinned, departmentId) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, title, description || "", priority, expiryDate ? new Date(expiryDate) : null, isPinned, departmentId]
        );

        await logAudit('NOTICE_CREATED', 'system', `Created notice ${title} in dept ${departmentId}`, id);

        return NextResponse.json({ message: "Notice created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating notice:", error);
        return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM Notice WHERE id = ?", [id]);
        return NextResponse.json({ message: "Notice deleted" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
