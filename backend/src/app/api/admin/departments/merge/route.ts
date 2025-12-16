
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const MergeSchema = z.object({
    sourceId: z.string().min(1),
    targetId: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = MergeSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const { sourceId, targetId } = parsed.data;

        if (sourceId === targetId) {
            return NextResponse.json({ error: "Cannot merge department into itself" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Move Users
            await connection.query("UPDATE User SET departmentId = ? WHERE departmentId = ?", [targetId, sourceId]);

            // 2. Move Courses
            await connection.query("UPDATE Course SET departmentId = ? WHERE departmentId = ?", [targetId, sourceId]);

            // 3. Move Batches (and their routines/students automatically follow the batch, but batch needs dept update)
            await connection.query("UPDATE Batch SET departmentId = ? WHERE departmentId = ?", [targetId, sourceId]);

            // 4. Move Notices
            await connection.query("UPDATE Notice SET departmentId = ? WHERE departmentId = ?", [targetId, sourceId]);

            // 5. Delete Source Department
            await connection.query("DELETE FROM Department WHERE id = ?", [sourceId]);

            await connection.commit();
            connection.release();

            return NextResponse.json({ message: "Departments merged successfully" });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error("Error merging departments:", error);
        return NextResponse.json({ error: "Failed to merge departments" }, { status: 500 });
    }
}
