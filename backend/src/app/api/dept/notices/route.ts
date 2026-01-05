
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const NoticeSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    expiryDate: z.string().optional(),
    isPinned: z.boolean().default(false),
    tags: z.array(z.string()).optional(), // Array of tag names
    actorId: z.string().optional()
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        // Fetch notices with their tags
        const [notices] = await pool.query<any[]>(`
            SELECT n.*, 
            GROUP_CONCAT(t.name) as tags
            FROM Notice n
            LEFT JOIN NoticeTag nt ON n.id = nt.noticeId
            LEFT JOIN Tag t ON nt.tagId = t.id
            WHERE n.departmentId = ? 
            GROUP BY n.id
            ORDER BY n.isPinned DESC, n.createdAt DESC
        `, [departmentId]);

        // Parse tags string back to array
        const formattedNotices = notices.map(notice => ({
            ...notice,
            tags: notice.tags ? notice.tags.split(',') : []
        }));

        return NextResponse.json(formattedNotices);
    } catch (error) {
        console.error("Error fetching notices:", error);
        return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, ...data } = body;

        if (!departmentId) return NextResponse.json({ error: "Department ID required" }, { status: 400 });

        const parsed = NoticeSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { title, description, expiryDate, isPinned, tags, actorId } = parsed.data;
        const id = "not-" + Date.now();

        await pool.query(
            "INSERT INTO Notice (id, title, description, expiryDate, isPinned, departmentId) VALUES (?, ?, ?, ?, ?, ?)",
            [id, title, description || "", expiryDate ? new Date(expiryDate) : null, isPinned, departmentId]
        );

        // Handle Tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // 1. Ensure tag exists
                // Use INSERT IGNORE or ON DUPLICATE KEY UPDATE to handle existing tags safely
                const tagId = 'tag-' + tagName.toLowerCase().replace(/\s+/g, '-');
                await pool.query(
                    "INSERT IGNORE INTO Tag (id, name) VALUES (?, ?)",
                    [tagId, tagName]
                );

                // 2. Link tag to notice
                // Get the tag ID (it might have been existing, so we query it if we didn't insert)
                // Actually, if we use a deterministic ID based on name, we know it unless there's a collision.
                // But better to query to be safe or use the deterministic ID.
                // Let's use the deterministic ID logic:
                await pool.query(
                    "INSERT INTO NoticeTag (noticeId, tagId) VALUES (?, ?)",
                    [id, tagId]
                );
            }
        }

        await logAudit('NOTICE_CREATED', actorId || 'system', `Created notice ${title} in dept ${departmentId}`, id);

        return NextResponse.json({ message: "Notice created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating notice:", error);
        return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM Notice WHERE id = ?", [id]);
        return NextResponse.json({ message: "Notice deleted" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
