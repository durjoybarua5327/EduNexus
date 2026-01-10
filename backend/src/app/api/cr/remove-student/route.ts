import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// DELETE - Remove a student from batch (CR/Top CR only)
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user.role !== 'CR' && session.user.role !== 'DEPT_ADMIN')) {
            return NextResponse.json({ error: "Unauthorized. Only CRs can remove students." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
        }

        // Get the current user's batch
        const [crProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [session.user.id]
        );

        if (!crProfile.length) {
            return NextResponse.json({ error: "Your profile not found" }, { status: 404 });
        }

        const crBatchId = crProfile[0].batchId;

        // Get the target student's info
        const [studentInfo] = await pool.query<any[]>(
            `SELECT u.id, u.role, u.isTopCR, sp.batchId 
             FROM User u 
             JOIN StudentProfile sp ON u.id = sp.userId 
             WHERE u.id = ?`,
            [studentId]
        );

        if (!studentInfo.length) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        const student = studentInfo[0];

        // Verify same batch
        if (student.batchId !== crBatchId) {
            return NextResponse.json({ error: "Can only manage students from your own batch" }, { status: 403 });
        }

        // Cannot remove self
        if (studentId === session.user.id) {
            return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
        }

        // Check permissions
        // @ts-ignore
        const isTopCR = session.user.isTopCR === true || session.user.isTopCR === 1;

        // Regular CR can only remove students, not other CRs
        if (!isTopCR && student.role === 'CR') {
            return NextResponse.json({ error: "Only Top CR can remove other CRs" }, { status: 403 });
        }

        // Top CR cannot remove another Top CR
        if (student.isTopCR) {
            return NextResponse.json({ error: "Cannot remove a Top CR" }, { status: 403 });
        }

        // Delete the student - cascade will handle StudentProfile
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Delete from StudentProfile first (if cascade isn't set)
            await connection.query("DELETE FROM StudentProfile WHERE userId = ?", [studentId]);

            // Delete user
            await connection.query("DELETE FROM User WHERE id = ?", [studentId]);

            await connection.commit();
            connection.release();

            return NextResponse.json({ success: true, message: "Student removed successfully" });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error("Error removing student:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
