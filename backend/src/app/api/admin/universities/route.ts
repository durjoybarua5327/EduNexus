
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for validation
const UniversitySchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
});

export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT u.*, 
            (SELECT COUNT(*) FROM Department d WHERE d.universityId = u.id) as deptCount 
            FROM University u 
            ORDER BY u.createdAt DESC
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching universities:", error);
        return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = UniversitySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
        }

        const { name, location } = parsed.data;
        const id = "uni-" + Date.now();

        await pool.query(
            "INSERT INTO University (id, name, location) VALUES (?, ?, ?)",
            [id, name, location]
        );

        return NextResponse.json({ message: "University created", id }, { status: 201 });
    } catch (error) {
        console.error("Error creating university:", error);
        return NextResponse.json({ error: "Failed to create university" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, name, location, isBanned } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (name) { updates.push("name = ?"); params.push(name); }
        if (location) { updates.push("location = ?"); params.push(location); }
        if (isBanned !== undefined) { updates.push("isBanned = ?"); params.push(isBanned); }

        if (updates.length === 0) return NextResponse.json({ message: "No changes" });

        params.push(id);

        await pool.query(
            `UPDATE University SET ${updates.join(", ")} WHERE id = ?`,
            params
        );

        return NextResponse.json({ message: "University updated" });
    } catch (error) {
        console.error("Error updating university:", error);
        return NextResponse.json({ error: "Failed to update university" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Deletion will cascade to departments due to schema definition
        await pool.query("DELETE FROM University WHERE id = ?", [id]);

        return NextResponse.json({ message: "University deleted" });
    } catch (error) {
        console.error("Error deleting university:", error);
        return NextResponse.json({ error: "Failed to delete university" }, { status: 500 });
    }
}
