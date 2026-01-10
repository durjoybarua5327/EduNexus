import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Check if user is Top CR (always fresh from database)
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || session.user.id;

        // Get fresh isTopCR from database
        const [user] = await pool.query<any[]>(
            "SELECT id, role, isTopCR FROM User WHERE id = ?",
            [userId]
        );

        if (!user.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            userId: user[0].id,
            role: user[0].role,
            isTopCR: user[0].isTopCR
        });

    } catch (error) {
        console.error("Error checking Top CR status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
