import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// POST - Promote current user to CR (utility endpoint)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Check current role
        const [user] = await pool.query<any[]>(
            "SELECT role FROM User WHERE id = ?",
            [userId]
        );

        if (!user.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Promote to CR
        await pool.query(
            "UPDATE User SET role = 'CR' WHERE id = ?",
            [userId]
        );

        return NextResponse.json({
            success: true,
            message: "You are now a CR! Please logout and login again.",
            previousRole: user[0].role
        });

    } catch (error) {
        console.error("Error promoting to CR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
