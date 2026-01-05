
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const BatchSchema = z.object({
    name: z.string().min(1),
    year: z.number().int().min(2000),
    section: z.string().optional(),
    startMonth: z.string().optional(),
    currentSemester: z.string().optional(),
    actorId: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        const [batches] = await pool.query<any[]>(`
            SELECT b.*, 
            (SELECT COUNT(*) FROM StudentProfile sp WHERE sp.batchId = b.id) as studentCount
            FROM Batch b 
            WHERE b.departmentId = ? 
            ORDER BY b.year DESC, b.name ASC
        `, [departmentId]);

        // Fetch CRs for these batches
        // Could be done in one query but let's keep it simple for now or use a join if performant.
        // Let's do a join to get CRs:
        const [crs] = await pool.query<any[]>(`
            SELECT u.id, u.name, sp.batchId 
            FROM User u
            JOIN StudentProfile sp ON u.id = sp.userId
            WHERE u.role = 'CR' AND u.departmentId = ?
        `, [departmentId]);

        // Merge CRs into batches
        const batchesWithCRs = batches.map(b => ({
            ...b,
            crs: crs.filter((c: any) => c.batchId === b.id)
        }));

        return NextResponse.json(batchesWithCRs);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = BatchSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, year, section, startMonth, currentSemester, actorId } = parsed.data;

        // Check for duplicates
        const [existing] = await pool.query<any[]>(
            "SELECT id FROM Batch WHERE name = ? AND section = ? AND departmentId = ? AND year = ?",
            [name, section || "A", departmentId, year]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "Batch already exists for this year and section" }, { status: 409 });
        }

        const id = "bath-" + Date.now();

        await pool.query(
            "INSERT INTO Batch (id, name, departmentId, year, section, startMonth, currentSemester) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, name, departmentId, year, section || "A", startMonth || "January", currentSemester || "1st"]
        );

        await logAudit('BATCH_CREATED', actorId || 'system', `Created batch ${name} (${year}) in dept ${departmentId}`, id);

        return NextResponse.json({ message: "Batch created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating batch:", error);
        return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: "Batch ID required" }, { status: 400 });

        const parsed = BatchSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { name, year, section, startMonth, currentSemester, actorId } = parsed.data;

        await pool.query(
            "UPDATE Batch SET name = ?, year = ?, section = ?, startMonth = ?, currentSemester = ? WHERE id = ?",
            [name, year, section || "A", startMonth || "January", currentSemester || "1st", id]
        );

        await logAudit('BATCH_UPDATED', actorId || 'system', `Updated batch ${name} (${year})`, id);

        return NextResponse.json({ message: "Batch updated" });
    } catch (error) {
        console.error("Error updating batch:", error);
        return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM Batch WHERE id = ?", [id]);
        await logAudit('BATCH_DELETED', 'system', `Deleted batch ${id}`, id);

        return NextResponse.json({ message: "Batch deleted" });
    } catch (error) {
        console.error("Error deleting batch:", error);
        return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
    }
}
