
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const departmentId = searchParams.get("departmentId");

        if (!departmentId) {
            return NextResponse.json({ error: "Department ID required" }, { status: 400 });
        }

        // Fetch recent files uploaded in courses belonging to this department
        // Join File -> Folder -> Course
        const [files] = await pool.query<any[]>(`
            SELECT f.id, f.name, f.url, f.type, f.size, f.createdAt, 
                   u.name as uploaderName, u.role as uploaderRole,
                   c.name as courseName, c.code as courseCode
            FROM File f
            JOIN Folder fol ON f.folderId = fol.id
            JOIN Course c ON fol.courseId = c.id
            LEFT JOIN User u ON f.uploadedBy = u.id
            WHERE c.departmentId = ?
            ORDER BY f.createdAt DESC
            LIMIT 50
        `, [departmentId]);

        return NextResponse.json(files);
    } catch (error) {
        console.error("Error fetching moderation files:", error);
        return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await pool.query("DELETE FROM File WHERE id = ?", [id]);
        await logAudit('CONTENT_REMOVED', 'system', `Removed flagged content ${id}`, id);

        return NextResponse.json({ message: "Content removed" });
    } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
