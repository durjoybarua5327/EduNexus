
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
            // Deduplicate tags by their generated ID to prevent PK violations
            // (e.g. "Exam" and "exam" would both generate "tag-exam")
            const uniqueTags = new Map<string, string>();

            for (const tagName of tags) {
                const tagId = 'tag-' + tagName.toLowerCase().replace(/\s+/g, '-');
                if (!uniqueTags.has(tagId)) {
                    uniqueTags.set(tagId, tagName);
                }
            }

            for (const [tagId, tagName] of uniqueTags.entries()) {
                // 1. Ensure tag exists
                await pool.query(
                    "INSERT IGNORE INTO Tag (id, name) VALUES (?, ?)",
                    [tagId, tagName]
                );

                // 2. Link tag to notice
                await pool.query(
                    "INSERT IGNORE INTO NoticeTag (noticeId, tagId) VALUES (?, ?)",
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

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { departmentId, id, ...data } = body;

        if (!id || !departmentId) return NextResponse.json({ error: "ID and Department ID required" }, { status: 400 });

        const parsed = NoticeSchema.safeParse(data);
        if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

        const { title, description, expiryDate, isPinned, tags, actorId } = parsed.data;

        await pool.query(
            "UPDATE Notice SET title = ?, description = ?, expiryDate = ?, isPinned = ? WHERE id = ? AND departmentId = ?",
            [title, description || "", expiryDate ? new Date(expiryDate) : null, isPinned, id, departmentId]
        );

        // Handle Tags (Sync)
        if (tags) {
            // 1. Remove old tags
            await pool.query("DELETE FROM NoticeTag WHERE noticeId = ?", [id]);

            // 2. Add new tags (Deduplicated)
            if (tags.length > 0) {
                const uniqueTags = new Map<string, string>();
                for (const tagName of tags) {
                    const tagId = 'tag-' + tagName.toLowerCase().replace(/\s+/g, '-');
                    if (!uniqueTags.has(tagId)) uniqueTags.set(tagId, tagName);
                }

                for (const [tagId, tagName] of uniqueTags.entries()) {
                    await pool.query("INSERT IGNORE INTO Tag (id, name) VALUES (?, ?)", [tagId, tagName]);
                    await pool.query("INSERT IGNORE INTO NoticeTag (noticeId, tagId) VALUES (?, ?)", [id, tagId]);
                }
            }
        }

        await logAudit('NOTICE_UPDATED', actorId || 'system', `Updated notice ${title}`, id);

        return NextResponse.json({ message: "Notice updated" });
    } catch (error) {
        console.error("Error updating notice:", error);
        return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
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
