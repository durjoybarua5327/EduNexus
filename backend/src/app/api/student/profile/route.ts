
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        let userId = searchParams.get('userId');

        // Verify if user is allowed to view other profiles (e.g. same batch or admin)
        // For now, allow viewing if authenticated, but maybe limit private info
        if (!userId) {
            userId = session.user.id;
        }

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
            // Use query<any[]> to ensure compatibility with RowDataPacket[] return type
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
        // TODO: Filter sensitive info if userId !== session.user.id
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            isTopCR: user.isTopCR || false,
            departmentId: user.departmentId,
            studentIdNo: profile?.studentIdNo || null, // Added studentIdNo
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

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, password } = body;
        const userId = session.user.id;

        // 1. Update Name
        if (name) {
            await pool.query("UPDATE User SET name = ? WHERE id = ?", [name, userId]);
        }

        // 2. Update Password (if provided)
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            // Assuming User table has 'password' column. If not, this might fail or need adjustment based on Auth provider.
            // Given it's a student portal, likely local auth.
            await pool.query("UPDATE User SET password = ? WHERE id = ?", [hashedPassword, userId]);
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully" });

    } catch (e) {
        console.error("Error updating profile:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
