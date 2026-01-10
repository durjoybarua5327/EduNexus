import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_ROLES = ["CR", "TEACHER", "DEPT_ADMIN"];

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, priority, isPinned, expiryDate, tags, targetCourses } = z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
            isPinned: z.boolean().optional(),
            expiryDate: z.string().optional(),
            tags: z.array(z.string()).optional(),
            targetCourses: z.array(z.string()).optional()
        }).parse(body);

        const authorId = session.user.id;
        let targetBatchIds: string[] = [];

        // Scenario A: Teacher/Admin providing specific courses
        if (targetCourses && targetCourses.length > 0) {
            // Strategy: Find batches that should receive notices for these courses
            // 1. Get the department and semester info for the selected courses
            // 2. Find batches in that department with matching currentSemester
            // 3. If no exact match, find all batches in the department (fallback)

            const placeholders = targetCourses.map(() => '?').join(',');

            console.log("Creating notice for courses:", targetCourses);

            // First, try to find batches with matching currentSemester
            const [rows] = await pool.query<any[]>(`
                SELECT DISTINCT b.id, b.name, b.currentSemester
                FROM Course c
                JOIN Semester s ON c.semesterId = s.id
                JOIN Batch b ON b.currentSemester = s.name AND b.departmentId = c.departmentId
                WHERE c.id IN (${placeholders})
            `, targetCourses);

            console.log("Batches found with exact semester match:", rows);

            if (rows.length > 0) {
                targetBatchIds = rows.map(r => r.id);
            } else {
                // Fallback: If no batches have matching currentSemester, 
                // find all batches in the same department as the courses
                console.log("No batches found with exact semester match, using department fallback");
                const [deptRows] = await pool.query<any[]>(`
                    SELECT DISTINCT b.id, b.name, b.currentSemester
                    FROM Course c
                    JOIN Batch b ON b.departmentId = c.departmentId
                    WHERE c.id IN (${placeholders})
                `, targetCourses);

                console.log("Batches found in department:", deptRows);
                targetBatchIds = deptRows.map(r => r.id);
            }
        }

        // Scenario B: CR/Student (or fallback), posting to their own batch
        if (targetBatchIds.length === 0) {
            const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [authorId]);
            if (profiles.length > 0 && profiles[0].batchId) {
                targetBatchIds.push(profiles[0].batchId);
            }
        }

        if (targetBatchIds.length === 0) {
            return NextResponse.json({ error: "No target batches found. Please ensure courses have associated batches in the department." }, { status: 400 });
        }

        // Insert Notice for each target batch
        // Optimization: We could use specific mapping table, but requirements adhere to existing ClassNotice structure (one row per notice per batch usually)
        // or we duplicate. Duplication is easier given current schema.
        const createdIds = [];

        for (const batchId of targetBatchIds) {
            const id = `cn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await pool.query(
                "INSERT INTO ClassNotice (id, title, description, priority, batchId, authorId, isPinned, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [id, title, description, priority, batchId, authorId, isPinned || false, expiryDate ? new Date(expiryDate) : null]
            );
            createdIds.push(id);

            // Handle Tags
            if (tags && tags.length > 0) {
                const uniqueTags = new Map<string, string>();
                for (const tagName of tags) {
                    const tagId = 'tag-' + tagName.toLowerCase().replace(/\s+/g, '-');
                    if (!uniqueTags.has(tagId)) uniqueTags.set(tagId, tagName);
                }

                for (const [tagId, tagName] of uniqueTags.entries()) {
                    await pool.query("INSERT IGNORE INTO Tag (id, name) VALUES (?, ?)", [tagId, tagName]);
                    await pool.query("INSERT IGNORE INTO ClassNoticeTag (noticeId, tagId) VALUES (?, ?)", [id, tagId]);
                }
            }
        }

        return NextResponse.json({ success: true, ids: createdIds });
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
            `SELECT n.*, GROUP_CONCAT(t.name) as tags, u.name as authorName, u.role as authorRole
             FROM ClassNotice n
             LEFT JOIN ClassNoticeTag nt ON n.id = nt.noticeId
             LEFT JOIN Tag t ON nt.tagId = t.id
             LEFT JOIN User u ON n.authorId = u.id
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
