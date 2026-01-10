import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "CR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, priority, isPinned, expiryDate, tags } = z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
            isPinned: z.boolean().optional(),
            expiryDate: z.string().optional(),
            tags: z.array(z.string()).optional()
        }).parse(body);

        // Get user's batch from StudentProfile
        const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [session.user.id]);

        if (profiles.length === 0 || !profiles[0].batchId) {
            return NextResponse.json({ error: "Batch not found for user" }, { status: 400 });
        }

        const batchId = profiles[0].batchId;

        const id = `cn-${Date.now()}`;
        await pool.query(
            "INSERT INTO ClassNotice (id, title, description, priority, batchId, authorId, isPinned, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, title, description, priority, batchId, session.user.id, isPinned || false, expiryDate ? new Date(expiryDate) : null]
        );

        // Handle Tags
        if (tags && tags.length > 0) {
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
                    "INSERT IGNORE INTO ClassNoticeTag (noticeId, tagId) VALUES (?, ?)",
                    [id, tagId]
                );
            }
        }

        return NextResponse.json({ success: true, id });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's batch
        const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [session.user.id]);

        if (profiles.length === 0 || !profiles[0].batchId) {
            return NextResponse.json({ notices: [] }); // Or error
        }

        const batchId = profiles[0].batchId;

        const [notices] = await pool.query<any[]>(
            `SELECT n.*, GROUP_CONCAT(t.name) as tags
             FROM ClassNotice n
             LEFT JOIN ClassNoticeTag nt ON n.id = nt.noticeId
             LEFT JOIN Tag t ON nt.tagId = t.id
             WHERE n.batchId = ?
             GROUP BY n.id
             ORDER BY n.isPinned DESC, n.createdAt DESC`,
            [batchId]
        );

        const formattedNotices = notices.map(notice => ({
            ...notice,
            tags: notice.tags ? notice.tags.split(',') : []
        }));

        return NextResponse.json({ notices: formattedNotices });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
