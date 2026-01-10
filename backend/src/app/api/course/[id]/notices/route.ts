
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Find the Course's semester Name and Department.
        const [courseRows] = await pool.query<any[]>(`
            SELECT c.semesterId, c.departmentId, s.name as semesterName
            FROM Course c
            JOIN Semester s ON c.semesterId = s.id
            WHERE c.id = ?
        `, [courseId]);

        if (courseRows.length === 0) return NextResponse.json({ notices: [] });

        const { semesterName, departmentId } = courseRows[0];

        // 2. Find Batches in this semester
        const [batches] = await pool.query<any[]>(`
            SELECT id FROM Batch WHERE departmentId = ? AND currentSemester = ?
        `, [departmentId, semesterName]);

        if (batches.length === 0) return NextResponse.json({ notices: [] });

        const batchIds = batches.map(b => b.id);

        // 3. Fetch ClassNotices for these batches
        // Using IN clause
        const placeholders = batchIds.map(() => '?').join(',');
        const [notices] = await pool.query<any[]>(
            `SELECT n.*, GROUP_CONCAT(t.name) as tags, u.name as authorName, u.role as authorRole
             FROM ClassNotice n
             LEFT JOIN ClassNoticeTag nt ON n.id = nt.noticeId
             LEFT JOIN Tag t ON nt.tagId = t.id
             LEFT JOIN User u ON n.authorId = u.id
             WHERE n.batchId IN (${placeholders})
             GROUP BY n.id
             ORDER BY n.isPinned DESC, n.createdAt DESC`,
            [...batchIds]
        );

        const formattedNotices = notices.map(notice => ({
            ...notice,
            tags: notice.tags ? notice.tags.split(',') : []
        }));

        return NextResponse.json(formattedNotices);

    } catch (e) {
        console.error("Error fetching course notices:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params;
        const session = await auth();
        // Allow Teachers and Admins
        if (!session?.user || (session.user.role !== 'TEACHER' && session.user.role !== 'DEPT_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        // Validation reused from similar logic, strict types
        const { title, description, priority, isPinned, expiryDate, tags } = body;

        if (!title || !description) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Resolve Batches
        const [courseRows] = await pool.query<any[]>(`
            SELECT c.semesterId, c.departmentId, s.name as semesterName
            FROM Course c
            JOIN Semester s ON c.semesterId = s.id
            WHERE c.id = ?
        `, [courseId]);

        if (courseRows.length === 0) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        const { semesterName, departmentId } = courseRows[0];

        const [batches] = await pool.query<any[]>(`
            SELECT id FROM Batch WHERE departmentId = ? AND currentSemester = ?
        `, [departmentId, semesterName]);

        if (batches.length === 0) return NextResponse.json({ error: "No active batches for this course to post to." }, { status: 400 });

        // 2. Post Notice to EACH batch
        // We probably want to post separate records so they are managed per batch
        // OR we need a "CourseNotice" table. But sticking to ClassNotice as decided:

        const createdIds = [];

        for (const batch of batches) {
            const id = `cn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // unique id

            await pool.query(
                "INSERT INTO ClassNotice (id, title, description, priority, batchId, authorId, isPinned, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [id, title, description, priority || 'NORMAL', batch.id, session.user.id, isPinned || false, expiryDate ? new Date(expiryDate) : null]
            );
            createdIds.push(id);

            // Tags
            if (tags && tags.length > 0) {
                const uniqueTags = new Set(tags as string[]);
                for (const tagName of uniqueTags) {
                    const tagId = 'tag-' + (tagName as string).toLowerCase().replace(/\s+/g, '-');
                    await pool.query("INSERT IGNORE INTO Tag (id, name) VALUES (?, ?)", [tagId, tagName]);
                    await pool.query("INSERT IGNORE INTO ClassNoticeTag (noticeId, tagId) VALUES (?, ?)", [id, tagId]);
                }
            }
        }

        return NextResponse.json({ success: true, ids: createdIds });

    } catch (e) {
        console.error("Error creating course notices:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
