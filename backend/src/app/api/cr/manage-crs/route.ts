import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Get all students in the CR's batch
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'CR') {
            return NextResponse.json({ error: "Unauthorized. Only CRs can access this." }, { status: 401 });
        }

        // Get CR's batch
        const [crProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [session.user.id]
        );

        if (!crProfile.length || !crProfile[0].batchId) {
            return NextResponse.json({ error: "CR batch not found" }, { status: 404 });
        }

        const batchId = crProfile[0].batchId;

        // Get all students and CRs in the same batch
        const [students] = await pool.query<any[]>(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.isTopCR,
                u.image,
                sp.studentIdNo,
                sp.batchId
            FROM User u
            JOIN StudentProfile sp ON u.id = sp.userId
            WHERE sp.batchId = ?
            AND u.role IN ('STUDENT', 'CR')
            ORDER BY 
                CASE WHEN u.isTopCR = TRUE THEN 0 ELSE 1 END,
                CASE WHEN u.role = 'CR' THEN 0 ELSE 1 END,
                u.name
        `, [batchId]);

        return NextResponse.json({ students, batchId });

    } catch (error) {
        console.error("Error fetching batch students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST - Promote a student to CR
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'CR') {
            return NextResponse.json({ error: "Unauthorized. Only CRs can promote students." }, { status: 401 });
        }

        // Check if the current user is Top CR
        const [currentUser] = await pool.query<any[]>(
            "SELECT isTopCR FROM User WHERE id = ?",
            [session.user.id]
        );

        if (!currentUser.length || !currentUser[0].isTopCR) {
            return NextResponse.json({ error: "Only Top CR can promote students to CR" }, { status: 403 });
        }

        const body = await req.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
        }

        // Verify the student is in the same batch
        const [crProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [session.user.id]
        );

        const [studentProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [studentId]
        );

        if (!crProfile.length || !studentProfile.length || crProfile[0].batchId !== studentProfile[0].batchId) {
            return NextResponse.json({ error: "Can only promote students from your own batch" }, { status: 403 });
        }

        // Promote student to CR
        await pool.query(
            "UPDATE User SET role = 'CR', isTopCR = FALSE WHERE id = ?",
            [studentId]
        );

        return NextResponse.json({ success: true, message: "Student promoted to CR successfully" });

    } catch (error) {
        console.error("Error promoting student:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE - Demote a CR to student
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== 'CR') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if the current user is Top CR
        const [currentUser] = await pool.query<any[]>(
            "SELECT isTopCR FROM User WHERE id = ?",
            [session.user.id]
        );

        if (!currentUser.length || !currentUser[0].isTopCR) {
            return NextResponse.json({ error: "Only Top CR can demote CRs" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get('userId');

        if (!targetId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Check if target is Top CR (cannot demote Top CR)
        const [targetUser] = await pool.query<any[]>(
            "SELECT isTopCR, role FROM User WHERE id = ?",
            [targetId]
        );

        if (!targetUser.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser[0].isTopCR) {
            return NextResponse.json({ error: "Cannot demote Top CR" }, { status: 403 });
        }

        if (targetUser[0].role !== 'CR') {
            return NextResponse.json({ error: "User is not a CR" }, { status: 400 });
        }

        // Verify same batch
        const [crProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [session.user.id]
        );

        const [targetProfile] = await pool.query<any[]>(
            "SELECT batchId FROM StudentProfile WHERE userId = ?",
            [targetId]
        );

        if (!crProfile.length || !targetProfile.length || crProfile[0].batchId !== targetProfile[0].batchId) {
            return NextResponse.json({ error: "Can only manage CRs from your own batch" }, { status: 403 });
        }

        // Demote CR to student
        await pool.query(
            "UPDATE User SET role = 'STUDENT' WHERE id = ?",
            [targetId]
        );

        return NextResponse.json({ success: true, message: "CR demoted to student successfully" });

    } catch (error) {
        console.error("Error demoting CR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
