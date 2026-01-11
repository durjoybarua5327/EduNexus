
import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let parentId = searchParams.get("parentId") === "root" ? null : searchParams.get("parentId");
    const ownerId = searchParams.get("ownerId");
    const courseId = searchParams.get("courseId");

    try {
        if (courseId && !parentId) {
            const [courseRoots] = await pool.query<any[]>("SELECT id FROM Folder WHERE courseId = ? AND parentId IS NULL LIMIT 1", [courseId]);
            if (courseRoots.length > 0) {
                parentId = courseRoots[0].id;
            }
        }


        const userRole = (session.user as any).role;
        const userId = session.user.id;

        let folderWhereConditions = ["parentId " + (parentId ? "= ?" : "IS NULL")];
        let folderQueryParams = parentId ? [parentId] : [];

        let fileWhereConditions = ["folderId " + (parentId ? "= ?" : "IS NULL")];
        let fileQueryParams = parentId ? [parentId] : [];

        if (userRole === "STUDENT" || userRole === "CR") {
            folderWhereConditions.push("(isPublic = 1 OR isSystem = 1 OR ownerId = ?)");
            folderQueryParams.push(userId);

            fileWhereConditions.push("(isPublic = 1 OR uploadedBy = ?)");
            fileQueryParams.push(userId);
        }

        if (ownerId && !parentId) {
            folderWhereConditions.push("ownerId = ?");
            folderQueryParams.push(ownerId);

            try {
                const [users] = await pool.query<any[]>("SELECT role, departmentId FROM User WHERE id = ?", [ownerId]);
                const user = users[0];

                if (user && (user.role === 'STUDENT' || user.role === 'CR')) {
                    const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [ownerId]);
                    const profile = profiles[0];
                    if (profile?.batchId) {
                        const allSemesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
                        for (const semesterName of allSemesters) {
                            const folderName = `${semesterName} Semester`;
                            const [existingSemFolder] = await pool.query<any[]>(
                                "SELECT id FROM Folder WHERE ownerId = ? AND name = ? AND parentId IS NULL",
                                [ownerId, folderName]
                            );

                            let semFolderId = existingSemFolder[0]?.id;
                            if (!semFolderId) {
                                semFolderId = 'folder-sys-' + semesterName + '-' + ownerId + '-' + Date.now();
                                await pool.query(
                                    "INSERT INTO Folder (id, name, parentId, ownerId, isPublic, isSystem) VALUES (?, ?, NULL, ?, ?, ?)",
                                    [semFolderId, folderName, ownerId, false, true]
                                );
                            }

                            const [semester] = await pool.query<any[]>(
                                "SELECT id FROM Semester WHERE departmentId = ? AND name = ?",
                                [user.departmentId, semesterName]
                            );

                            if (semester?.[0]?.id) {
                                const [courses] = await pool.query<any[]>(
                                    "SELECT id, name, code FROM Course WHERE semesterId = ?",
                                    [semester[0].id]
                                );
                                for (const course of courses) {
                                    const [existingCourseFolder] = await pool.query<any[]>(
                                        "SELECT id FROM Folder WHERE ownerId = ? AND parentId = ? AND courseId = ?",
                                        [ownerId, semFolderId, course.id]
                                    );
                                    if (existingCourseFolder.length === 0) {
                                        const courseFolderId = 'folder-sys-' + course.id + '-' + ownerId + '-' + Date.now();
                                        const displayName = course.code ? `${course.code} - ${course.name}` : course.name;
                                        await pool.query(
                                            "INSERT INTO Folder (id, name, parentId, ownerId, isPublic, isSystem, courseId) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                            [courseFolderId, displayName, semFolderId, ownerId, false, true, course.id]
                                        );
                                    }
                                }
                            }
                        }
                    }
                } else if (user && user.role === 'TEACHER') {
                    // TEACHER SYNC LOGIC
                    // Teachers get Root Folders for each of their Courses
                    const [courses] = await pool.query<any[]>(
                        "SELECT id, name, code FROM Course WHERE teacherId = ?",
                        [ownerId]
                    );

                    for (const course of courses) {
                        const displayName = course.code ? `${course.code} - ${course.name}` : course.name;

                        // Check if root folder exists for this course
                        const [existingFolder] = await pool.query<any[]>(
                            "SELECT id FROM Folder WHERE ownerId = ? AND parentId IS NULL AND courseId = ?",
                            [ownerId, course.id]
                        );

                        if (existingFolder.length === 0) {
                            const folderId = 'folder-sys-' + course.id + '-' + ownerId + '-' + Date.now();
                            await pool.query(
                                "INSERT INTO Folder (id, name, parentId, ownerId, isPublic, isSystem, courseId) VALUES (?, ?, NULL, ?, ?, ?, ?)",
                                [folderId, displayName, ownerId, true, true, course.id]
                            );
                        }
                    }
                }
            } catch (syncError: any) {
                console.error("Auto-sync folder error:", syncError);
            }
        }

        if (courseId && !parentId) {
            folderWhereConditions.push("courseId = ?");
            folderQueryParams.push(courseId);
        }

        const folderWhereClause = folderWhereConditions.length > 0 ? " WHERE " + folderWhereConditions.join(" AND ") : "";
        const fileWhereClause = fileWhereConditions.length > 0 ? " WHERE " + fileWhereConditions.join(" AND ") : "";

        const folderQuery = "SELECT * FROM Folder" + folderWhereClause + " ORDER BY CASE WHEN isSystem = 1 AND name LIKE '%Semester' THEN 0 ELSE 1 END, name ASC, createdAt DESC";
        const fileQuery = "SELECT * FROM File" + fileWhereClause + " ORDER BY createdAt DESC";

        const [folders] = await pool.query(folderQuery, folderQueryParams);
        const [files] = await pool.query(fileQuery, fileQueryParams);

        // Add item counts to each folder (files + subfolders)
        const foldersWithCounts = await Promise.all(
            (folders as any[]).map(async (folder) => {
                // Count files in this folder (respecting privacy)
                let fCountQuery = "SELECT COUNT(*) as count FROM File WHERE folderId = ?";
                let fCountParams = [folder.id];
                if (userRole === "STUDENT" || userRole === "CR") {
                    fCountQuery += " AND (isPublic = 1 OR uploadedBy = ?)";
                    fCountParams.push(userId);
                }
                const [fileCountResult] = await pool.query<any[]>(fCountQuery, fCountParams);
                const fileCount = fileCountResult[0]?.count || 0;

                // Count subfolders in this folder (respecting privacy)
                let sfCountQuery = "SELECT COUNT(*) as count FROM Folder WHERE parentId = ?";
                let sfCountParams = [folder.id];
                if (userRole === "STUDENT" || userRole === "CR") {
                    sfCountQuery += " AND (isPublic = 1 OR ownerId = ?)";
                    sfCountParams.push(userId);
                }
                const [subfolderCountResult] = await pool.query<any[]>(sfCountQuery, sfCountParams);
                const subfolderCount = subfolderCountResult[0]?.count || 0;

                return {
                    ...folder,
                    isPublic: folder.isSystem ? true : !!folder.isPublic,
                    _count: {
                        files: fileCount,
                        subfolders: subfolderCount,
                        total: fileCount + subfolderCount
                    }
                };
            })
        );

        // Build breadcrumbs if we're inside a folder
        let breadcrumbs: any[] = [];
        if (parentId) {
            let currentId = parentId;
            while (currentId) {
                const [folderRows] = await pool.query<any[]>(
                    "SELECT id, name, parentId FROM Folder WHERE id = ?",
                    [currentId]
                );
                const folder = folderRows[0];
                if (folder) {
                    breadcrumbs.unshift({ id: folder.id, name: folder.name });
                    currentId = folder.parentId;
                } else {
                    break;
                }
            }
        }

        return NextResponse.json({
            folders: foldersWithCounts,
            files: (files as any[]).map(f => ({ ...f, isPublic: !!f.isPublic })),
            breadcrumbs
        });
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
                [id, name, pid, userId, !!isPublic, courseId || null]
            );
            return NextResponse.json({ success: true, id });
        } else if (type === "file") {
            const id = 'file-' + Date.now();
            const finalSize = size || 0;

            await pool.query(
                "INSERT INTO File (id, name, url, folderId, size, type, uploadedBy, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [id, name, url, folderId, finalSize, "unknown", userId, !!isPublic]
            );
            return NextResponse.json({ success: true, id });
        }
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        const [rows] = await pool.query<any[]>("SELECT ownerId, isSystem FROM Folder WHERE id = ?", [id]);
        const folder = rows[0];

        if (!folder) {
            const [fileRows] = await pool.query<any[]>("SELECT uploadedBy FROM File WHERE id = ?", [id]);
            const file = fileRows[0];
            if (!file) {
                return NextResponse.json({ error: "Not found" }, { status: 404 });
            }
            if (file.uploadedBy !== session.user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
            await pool.query("DELETE FROM File WHERE id = ?", [id]);
            return NextResponse.json({ success: true });
        }

        if (folder.ownerId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        if (folder.isSystem) return NextResponse.json({ error: "System folders cannot be deleted" }, { status: 403 });

        await pool.query("DELETE FROM Folder WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("DELETE Error:", e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, name, isPublic } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        const [rows] = await pool.query<any[]>("SELECT ownerId, isSystem FROM Folder WHERE id = ?", [id]);
        const folder = rows[0];
        // If folder exists, verify owner. If not, we check for file in the name update block.
        if (folder && folder.ownerId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        if (name) {
            if (folder && folder.isSystem) return NextResponse.json({ error: "System folders cannot be renamed" }, { status: 403 });

            if (folder) {
                await pool.query("UPDATE Folder SET name = ? WHERE id = ?", [name, id]);
            } else {
                const [fileRows] = await pool.query<any[]>("SELECT uploadedBy FROM File WHERE id = ?", [id]);
                const file = fileRows[0];
                if (file) {
                    if (file.uploadedBy !== session.user.id) {
                        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
                    }
                    await pool.query("UPDATE File SET name = ? WHERE id = ?", [name, id]);
                } else {
                    return NextResponse.json({ error: "Item not found" }, { status: 404 });
                }
            }
        }

        if (isPublic !== undefined) {
            if (folder) {
                await pool.query("UPDATE Folder SET isPublic = ? WHERE id = ?", [isPublic, id]);
            } else {
                const [fileRows] = await pool.query<any[]>("SELECT uploadedBy FROM File WHERE id = ?", [id]);
                const file = fileRows[0];
                if (file) {
                    if (file.uploadedBy !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
                    await pool.query("UPDATE File SET isPublic = ? WHERE id = ?", [isPublic, id]);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

