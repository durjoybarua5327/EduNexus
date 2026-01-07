
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;

        // 1. Get User Info (Department)
        const [users] = await pool.query<any[]>("SELECT * FROM User WHERE id = ?", [userId]);
        const user = users[0];
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Get Student Profile (Batch)
        const [profiles] = await pool.query<any[]>("SELECT * FROM StudentProfile WHERE userId = ?", [userId]);
        const profile = profiles[0]; // Might be null if not yet assigned

        let batch = null;
        let semester = null;
        let semesterId = null;

        if (profile?.batchId) {
            // 3. Get Batch Info (Current Semester Name)
            const [batches] = await pool.query<any[]>("SELECT * FROM Batch WHERE id = ?", [profile.batchId]);
            batch = batches[0];

            if (batch?.currentSemester) {
                // 4. Get Semester ID based on name and department
                const [semesters] = await pool.query<any[]>(
                    "SELECT * FROM Semester WHERE departmentId = ? AND name = ?",
                    [user.departmentId, batch.currentSemester]
                );
                semester = semesters[0];
                semesterId = semester?.id;
            }
        }

        // Return combined context
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            departmentId: user.departmentId,
            batchId: profile?.batchId || null,
            batchName: batch?.name || null,
            semesterId: semesterId || null,
            semesterName: batch?.currentSemester || null
        });

    } catch (e) {
        console.error("Error fetching student profile:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
