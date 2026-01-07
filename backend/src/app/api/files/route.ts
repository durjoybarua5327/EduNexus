
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") === "root" ? null : searchParams.get("parentId");
    const ownerId = searchParams.get("ownerId");
    const courseId = searchParams.get("courseId");

    try {
        let folderQuery = "SELECT * FROM Folder WHERE parentId ";
        let fileQuery = "SELECT * FROM File WHERE folderId ";
        const params: any[] = [];

        // Handle Parent ID (Root or Specific Folder)
        if (parentId) {
            folderQuery += "= ?";
            fileQuery += "= ?";
            params.push(parentId);
        } else {
            folderQuery += "IS NULL";
            fileQuery += "IS NULL";
        }

        // Handle Filters (Mutually Exclusive ideally, or combined)
        if (ownerId) {
            folderQuery += " AND ownerId = ?";
            // Files don't strictly assume owner match if they are in the folder, 
            // but we might want to filter? Usually files inherit folder access.
            // For now, let's assume we filter Folders by owner. 
            // Files are fetched by folderId, so if we are in root, we shouldn't see loose files unless they are queryable?
            // The existing logic fetches files in the *current* folder (parentId).
            // So filtering by ownerId mainly applies to the *Folders* we see in Root.
            if (!parentId) {
                // Only filter root folders by owner if explicitly asked
                params.push(ownerId);
            } else {
                // Inner folders/files are visible if parent is visible? 
                // Removing the extra param push if we don't append logic 
                // Correction: We must append the condition if we add the param
                // But wait, the previous code structure is rigid.
                // Let's rewrite query construction.
            }
        }

        // REWRITE Query Construction for better flexibility
        let whereConditions = ["parentId " + (parentId ? "= ?" : "IS NULL")];
        let queryParams = parentId ? [parentId] : [];

        if (ownerId && !parentId) {
            // Only filter by owner at root level or if enforced
            whereConditions.push("ownerId = ?");
            queryParams.push(ownerId);
        }

        if (courseId && !parentId) {
            whereConditions.push("courseId = ?");
            queryParams.push(courseId);
        }

        const whereClause = " WHERE " + whereConditions.join(" AND ");

        folderQuery = "SELECT * FROM Folder" + whereClause + " ORDER BY createdAt DESC";
        fileQuery = "SELECT * FROM File WHERE folderId " + (parentId ? "= ?" : "IS NULL") + " ORDER BY createdAt DESC";

        // Files query needs its own params (just parentId)
        const fileParams = parentId ? [parentId] : [];

        const [folders] = await pool.query(folderQuery, queryParams);
        const [files] = await pool.query(fileQuery, fileParams);

        return NextResponse.json({ folders, files });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, name, parentId, folderId, size, url, isPublic, courseId } = body;
    const userId = session.user.id;

    try {
        if (type === "folder") {
            const id = 'folder-' + Date.now();
            const pid = parentId === "root" ? null : parentId;
            await pool.query(
                "INSERT INTO Folder (id, name, parentId, ownerId, isPublic, courseId) VALUES (?, ?, ?, ?, ?, ?)",
                [id, name, pid, userId, isPublic || false, courseId || null]
            );
            return NextResponse.json({ success: true, id });
        } else if (type === "file") {
            const id = 'file-' + Date.now();
            await pool.query(
                "INSERT INTO File (id, name, url, folderId, size, type, uploadedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [id, name, url, folderId, size, "unknown", userId]
            );
            return NextResponse.json({ success: true, id });
        }
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

