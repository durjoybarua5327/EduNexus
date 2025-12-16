
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const RoutineSchema = z.object({
    batchId: z.string().min(1),
    type: z.enum(['CLASS', 'EXAM']),
    content: z.string().optional(),
    url: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");
        const type = searchParams.get("type"); // Optional filter

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        let query = `
            SELECT r.*, b.name as batchName, b.year as batchYear, b.section as batchSection
            FROM Routine r
            JOIN Batch b ON r.batchId = b.id
            WHERE b.departmentId = ?
        `;
        const params = [departmentId];

        if (type) {
            query += ` AND r.type = ?`;
            params.push(type);
        }

        query += ` ORDER BY r.createdAt DESC`;

        const [routines] = await pool.query<any[]>(query, params);

        return NextResponse.json(routines);
    } catch (error) {
        console.error("Error fetching routines:", error);
        return NextResponse.json({ error: "Failed to fetch routines" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // departmentId is not needed for insertion as we link to batchId, 
        // but we might want to verify batch belongs to dept? Skipping for speed.

        const parsed = RoutineSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { batchId, type, content, url } = parsed.data;
        const id = "rtn-" + Date.now();

        await pool.query(
            "INSERT INTO Routine (id, batchId, type, content, url) VALUES (?, ?, ?, ?, ?)",
            [id, batchId, type, content || "", url || ""]
        );

        // Fetch user ID from session/token ideally, using 'system' for now
        await logAudit('NOTICE_CREATED', 'system', `Created ${type} routine for batch ${batchId}`, id);
        // Note: Reusing NOTICE_CREATED as generic 'content created' or should add ROUTINE_CREATED to audit.ts later.

        return NextResponse.json({ message: "Routine created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating routine:", error);
        return NextResponse.json({ error: "Failed to create routine" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM Routine WHERE id = ?", [id]);
        return NextResponse.json({ message: "Routine deleted" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
