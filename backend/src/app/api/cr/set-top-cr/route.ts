import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// POST - Set a CR as Top CR (temp utility endpoint - should be removed in production)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId } = body;

        // If no userId provided, use current user
        const targetUserId = userId || session.user.id;

        // Check if user is CR
        const [user] = await pool.query<any[]>(
            "SELECT role FROM User WHERE id = ?",
            [targetUserId]
        );

        if (!user.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user[0].role !== 'CR') {
            return NextResponse.json({ error: "User must be a CR" }, { status: 400 });
        }

        // Set as Top CR
        await pool.query(
            "UPDATE User SET isTopCR = TRUE WHERE id = ?",
            [targetUserId]
        );

        return NextResponse.json({
            success: true,
            message: "User set as Top CR successfully",
            userId: targetUserId
        });

    } catch (error) {
        console.error("Error setting Top CR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
