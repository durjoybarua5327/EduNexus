
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const RoutineSchema = z.object({
    batchId: z.string().min(1),
    type: z.enum(['CLASS', 'EXAM', 'NOTICE']),
    content: z.string().optional(),
    url: z.string().optional(),
    departmentId: z.string().optional(), // Added for ALL case
    actorId: z.string().optional(), // Added for Audit Logging
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");
        const batchId = searchParams.get("batchId"); // Optional filter
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

        if (batchId) {
            query += ` AND r.batchId = ?`;
            params.push(batchId);
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

        const parsed = RoutineSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { batchId, type, content, url, departmentId, actorId } = parsed.data;

        let batchIds: string[] = [];

        // Handle "ALL" - fetch all batches from department
        if (batchId === 'ALL') {
            if (!departmentId) {
                return NextResponse.json({ error: "Department ID required for ALL batches" }, { status: 400 });
            }
            const [batches] = await pool.query<any[]>(
                "SELECT id FROM Batch WHERE departmentId = ?",
                [departmentId]
            );
            batchIds = batches.map(b => b.id);
        } else {
            // Handle comma-separated batch IDs or single ID
            batchIds = batchId.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }

        if (batchIds.length === 0) {
            return NextResponse.json({ error: "No valid batches found" }, { status: 400 });
        }

        // Check for duplicates
        const placeholders = batchIds.map(() => '?').join(',');
        const [existing] = await pool.query<any[]>(
            `SELECT b.name FROM Routine r JOIN Batch b ON r.batchId = b.id WHERE r.type = ? AND r.batchId IN (${placeholders})`,
            [type, ...batchIds]
        );

        if (existing.length > 0) {
            // distinct names
            const names = Array.from(new Set(existing.map(e => e.name))).join(', ');
            return NextResponse.json({
                error: `A ${type.toLowerCase()} already exists for: ${names}. Please delete the existing one first.`
            }, { status: 409 });
        }

        // Create a routine entry for each batch
        const timestamp = Date.now();
        for (let i = 0; i < batchIds.length; i++) {
            const id = `rtn-${timestamp}-${i}`;
            await pool.query(
                "INSERT INTO Routine (id, batchId, type, content, url) VALUES (?, ?, ?, ?, ?)",
                [id, batchIds[i], type, content || "", url || ""]
            );
        }

        await logAudit('NOTICE_CREATED', actorId || 'system', `Created ${type} routine for ${batchIds.length} batch(es)`, `rtn-${timestamp}`);

        return NextResponse.json({ message: "Routine created", count: batchIds.length }, { status: 201 });
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
