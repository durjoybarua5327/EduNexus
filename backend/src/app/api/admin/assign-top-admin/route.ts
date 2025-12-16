
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const AssignTopAdminSchema = z.object({
    userId: z.string().min(1),
    departmentId: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = AssignTopAdminSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const { userId, departmentId } = parsed.data;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Check if department already has a Top Admin
            const [existingTop] = await connection.query<any[]>(
                "SELECT id FROM User WHERE departmentId = ? AND isTopDepartmentAdmin = TRUE",
                [departmentId]
            );

            if (existingTop.length > 0 && existingTop[0].id !== userId) {
                // Optional: Decide if we want to overwrite or error. 
                // Requirement says "Only one Top Department Admin". 
                // Let's demote the existing one to regular DEPT_ADMIN to enforce constraint safely.
                await connection.query("UPDATE User SET isTopDepartmentAdmin = FALSE WHERE id = ?", [existingTop[0].id]);
            }

            // 2. Promote new user
            // Ensure they are DEPT_ADMIN first? Or just set it.
            await connection.query(
                "UPDATE User SET role = 'DEPT_ADMIN', isTopDepartmentAdmin = TRUE, departmentId = ? WHERE id = ?",
                [departmentId, userId]
            );

            await connection.commit();

            // Audit Log (outside transaction or after commit)
            const [adminRows] = await connection.query<any[]>("SELECT id FROM User WHERE role = 'SUPER_ADMIN' LIMIT 1");
            const actorId = adminRows[0]?.id || 'system';
            await logAudit('TOP_ADMIN_ASSIGNED', actorId, `Promoted user ${userId} to Top Admin for department ${departmentId}`, userId);

            connection.release();

            return NextResponse.json({ message: "Top Department Admin assigned successfully" });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error("Error assigning top admin:", error);
        return NextResponse.json({ error: "Failed to assign top admin" }, { status: 500 });
    }
}
