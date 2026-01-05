
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query) return NextResponse.json([]);

        const [tags] = await pool.query<any[]>(
            "SELECT * FROM Tag WHERE name LIKE ? LIMIT 10",
            [`%${query}%`]
        );

        return NextResponse.json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}
