import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_ROLES = ["CR", "TEACHER", "DEPT_ADMIN"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const { title, description, priority, isPinned } = z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
            isPinned: z.boolean().optional()
        }).parse(body);

        // Verify ownership - user can only edit their own notices
        const [existing] = await pool.query<any[]>(
            "SELECT authorId FROM ClassNotice WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json({ error: "Notice not found" }, { status: 404 });
        }

        if (existing[0].authorId !== session.user.id) {
            return NextResponse.json({ error: "You can only edit your own notices" }, { status: 403 });
        }

        // Update functionality
        await pool.query(
            "UPDATE ClassNotice SET title = ?, description = ?, priority = ?, isPinned = ? WHERE id = ?",
            [title, description, priority, isPinned || false, id]
        );

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership - user can only delete their own notices
        const [existing] = await pool.query<any[]>(
            "SELECT authorId FROM ClassNotice WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json({ error: "Notice not found" }, { status: 404 });
        }

        if (existing[0].authorId !== session.user.id) {
            return NextResponse.json({ error: "You can only delete your own notices" }, { status: 403 });
        }

        await pool.query("DELETE FROM ClassNotice WHERE id = ?", [id]);

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
