
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacherId = session.user.id;

        // Fetch all ClassNotices authored by this teacher
        // This acts as "My Notices"
        const [notices] = await pool.query<any[]>(
            `SELECT n.*, GROUP_CONCAT(t.name) as tags, 
                    'Class Notice' as type,
                   (SELECT name FROM Batch WHERE id = n.batchId) as batchName,
                   c.name as courseName, c.code as courseCode
             FROM ClassNotice n
             LEFT JOIN ClassNoticeTag nt ON n.id = nt.noticeId
             LEFT JOIN Tag t ON nt.tagId = t.id
             LEFT JOIN Course c ON n.courseId = c.id
             WHERE n.authorId = ?
             GROUP BY n.id, c.id
             ORDER BY n.createdAt DESC`,
            [teacherId]
        );

        const formattedNotices = notices.map(notice => ({
            ...notice,
            tags: notice.tags ? notice.tags.split(',') : []
        }));

        return NextResponse.json(formattedNotices);

    } catch (e) {
        console.error("Error fetching teacher notices:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
