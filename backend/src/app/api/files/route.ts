
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") === "root" ? null : searchParams.get("parentId");

    try {
        let folderQuery = "SELECT * FROM Folder WHERE parentId ";
        let fileQuery = "SELECT * FROM File WHERE folderId ";
        const params: any[] = [];

        if (parentId) {
            folderQuery += "= ?";
            fileQuery += "= ?";
            params.push(parentId);
        } else {
            folderQuery += "IS NULL";
            fileQuery += "IS NULL";
        }

        const [folders] = await pool.query(folderQuery, params);
        const [files] = await pool.query(fileQuery, params);

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
    const { type, name, parentId, folderId, size, url } = body;
    const userId = session.user.id;

    try {
        if (type === "folder") {
            const id = 'folder-' + Date.now();
            const pid = parentId === "root" ? null : parentId;
            await pool.query(
                "INSERT INTO Folder (id, name, parentId, ownerId) VALUES (?, ?, ?, ?)",
                [id, name, pid, userId]
            );
            return NextResponse.json({ success: true });
        } else if (type === "file") {
            const id = 'file-' + Date.now();
            await pool.query(
                "INSERT INTO File (id, name, url, folderId, size, type) VALUES (?, ?, ?, ?, ?, ?)",
                [id, name, url, folderId, size, "unknown"]
            );
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

