import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Access levels allowed to manage class notices
 */
const ALLOWED_ROLES = ["CR", "TEACHER", "DEPT_ADMIN"];

/**
 * Notice Schema Validation
 */
const NoticeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    isPinned: z.boolean().optional().default(false),
    expiryDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    targetCourses: z.array(z.string()).optional()
});

/**
 * POST /api/class-notice
 * Creates notices for specific courses or a general batch notice.
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = NoticeSchema.parse(body);
        const { title, description, priority, isPinned, expiryDate, tags, targetCourses } = validatedData;

        const authorId = session.user.id;
        const noticeTargets: { batchId: string, courseId: string | null }[] = [];

        // --- STEP 1: Determine Target Batches ---

        // Scenario A: Faculty/Admin providing specific courses
        if (targetCourses && targetCourses.length > 0) {
            const placeholders = targetCourses.map(() => '?').join(',');

            // Fetch all batches in the department associated with the courses
            // This ensures the notice is stored even if some batches are in different semesters
            const [departmentBatches] = await pool.query<any[]>(`
                SELECT DISTINCT b.id as batchId, c.id as courseId
                FROM course c
                LEFT JOIN semester s ON c.semesterId = s.id
                JOIN batch b ON b.departmentId = COALESCE(c.departmentId, s.departmentId)
                WHERE c.id IN (${placeholders})
            `, targetCourses);

            departmentBatches.forEach(row => noticeTargets.push({
                batchId: row.batchId,
                courseId: row.courseId
            }));
        }

        // Scenario B: CR/Student posting to their own batch
        if (noticeTargets.length === 0 && (!targetCourses || targetCourses.length === 0)) {
            const [profiles] = await pool.query<any[]>("SELECT batchId FROM studentprofile WHERE userId = ?", [authorId]);
            if (profiles.length > 0 && profiles[0].batchId) {
                noticeTargets.push({ batchId: profiles[0].batchId, courseId: null });
            }
        }

        // Validation for cases with no targetable batches
        if (noticeTargets.length === 0) {

            return NextResponse.json({
                success: true,
                ids: [],
                message: "Notice accepted but no active batches found to receive it."
            });
        }

        // --- STEP 2: Create Notice Records ---

        const createdNoticeIds: string[] = [];

        for (const target of noticeTargets) {
            const noticeId = `cn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            await pool.query(
                `INSERT INTO classnotice (
                    id, title, description, priority, batchId, authorId, courseId, isPinned, expiryDate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    noticeId, title, description, priority, target.batchId, authorId,
                    target.courseId, isPinned, expiryDate ? new Date(expiryDate) : null
                ]
            );

            createdNoticeIds.push(noticeId);

            // Handle Tags
            if (tags && tags.length > 0) {
                for (const tagName of tags) {
                    const tagId = 'tag-' + tagName.toLowerCase().replace(/\s+/g, '-');
                    await pool.query("INSERT IGNORE INTO tag (id, name) VALUES (?, ?)", [tagId, tagName]);
                    await pool.query("INSERT IGNORE INTO classnoticetag (noticeId, tagId) VALUES (?, ?)", [noticeId, tagId]);
                }
            }
        }

        return NextResponse.json({ success: true, ids: createdNoticeIds });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("[CLASS_NOTICE_POST_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * GET /api/class-notice
 * Fetches relevant notices for the logged-in student's current semester.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Identify Student's Batch Context
        const [profileRows] = await pool.query<any[]>(`
            SELECT sp.batchId, b.currentSemester 
            FROM studentprofile sp 
            JOIN batch b ON sp.batchId = b.id 
            WHERE sp.userId = ?
        `, [session.user.id]);

        if (profileRows.length === 0 || !profileRows[0].batchId) {
            return NextResponse.json({ notices: [] });
        }

        const { batchId, currentSemester } = profileRows[0];

        // 2. Fetch Filtered Notices
        // We show:
        // - General notices (courseId is null)
        // - Course notices where the course belongs to the student's current semester
        const [noticeRows] = await pool.query<any[]>(
            `SELECT n.*, GROUP_CONCAT(t.name) as tags, u.name as authorName, u.role as authorRole,
                    c.name as courseName, c.code as courseCode, s.name as courseSemester
             FROM classnotice n
             LEFT JOIN classnoticetag nt ON n.id = nt.noticeId
             LEFT JOIN tag t ON nt.tagId = t.id
             LEFT JOIN user u ON n.authorId = u.id
             LEFT JOIN course c ON n.courseId = c.id
             LEFT JOIN semester s ON c.semesterId = s.id
             WHERE n.batchId = ?
             AND (
                 n.courseId IS NULL
                 OR (s.name IS NOT NULL AND (
                     LOWER(TRIM(s.name)) = LOWER(TRIM(?))
                     OR (
                        REGEXP_REPLACE(s.name, '[^0-9]', '') = REGEXP_REPLACE(?, '[^0-9]', '')
                        AND REGEXP_REPLACE(s.name, '[^0-9]', '') != ''
                     )
                 ))
                 OR (c.id IS NOT NULL AND c.semesterId IS NULL)
             )
             GROUP BY n.id, u.id, c.id
             ORDER BY n.isPinned DESC, n.createdAt DESC`,
            [batchId, currentSemester, currentSemester]
        );

        const formattedNotices = noticeRows.map(notice => ({
            ...notice,
            tags: notice.tags ? notice.tags.split(',') : []
        }));

        return NextResponse.json({ notices: formattedNotices });
    } catch (error) {
        console.error("[CLASS_NOTICE_GET_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
