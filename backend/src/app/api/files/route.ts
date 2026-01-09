
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
            whereConditions.push("ownerId = ?");
            queryParams.push(ownerId);

            // SYNC LOGIC: If we are fetching root folders for a user, check/sync system folders
            // Only do this if filtering by owner (which is the case for "My Files")
            // This ensures automatic folder creation upon visiting
            try {
                const log = (msg: string) => console.log('SYNC: ' + msg);

                log(`SYNC START: ownerId=${ownerId}`);

                // Ensure we have User's role and profile context
                const [users] = await pool.query<any[]>("SELECT role, departmentId FROM User WHERE id = ?", [ownerId]);
                const user = users[0];
                log(`SYNC: User found: ${user?.role} ${user?.departmentId}`);

                if (user && (user.role === 'STUDENT' || user.role === 'CR')) {
                    // Get Student Profile to find Batch (applicable for both STUDENT and CR)
                    const [profiles] = await pool.query<any[]>("SELECT batchId FROM StudentProfile WHERE userId = ?", [ownerId]);
                    const profile = profiles[0];
                    log(`SYNC: Profile found: ${profile?.batchId}`);

                    if (profile?.batchId) {
                        // Create folders for ALL semesters (1st through 8th)
                        const allSemesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

                        for (const semesterName of allSemesters) {
                            const folderName = `${semesterName} Semester`;

                            // 1. Check/Create Root Semester Folder
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
                                log(`SYNC: Created Sem Folder: ${folderName}`);
                            }

                            // 2. Sync Course Folders inside Semester Folder
                            // Get courses for this specific semester
                            const [semester] = await pool.query<any[]>(
                                "SELECT id FROM Semester WHERE departmentId = ? AND name = ?",
                                [user.departmentId, semesterName]
                            );

                            if (semester?.[0]?.id) {
                                const [courses] = await pool.query<any[]>(
                                    "SELECT id, name, code FROM Course WHERE semesterId = ?",
                                    [semester[0].id]
                                );
                                log(`SYNC: Courses found for ${semesterName}: ${courses?.length}`);

                                for (const course of courses) {
                                    // Check/Create Course Folder
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
                                        log(`SYNC: Created Course Folder: ${displayName}`);
                                    }
                                }
                            } else {
                                log(`SYNC: No semester record found for ${user.departmentId} ${semesterName}`);
                            }
                        }
                    }
                }
            } catch (syncError: any) {
                console.error("Auto-sync folder error:", syncError);
                // Non-blocking error, continue fetching existing folders
            }
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

        // Add item counts to each folder (files + subfolders)
        const foldersWithCounts = await Promise.all(
            (folders as any[]).map(async (folder) => {
                // Count files in this folder
                const [fileCountResult] = await pool.query<any[]>(
                    "SELECT COUNT(*) as count FROM File WHERE folderId = ?",
                    [folder.id]
                );
                const fileCount = fileCountResult[0]?.count || 0;

                // Count subfolders in this folder
                const [subfolderCountResult] = await pool.query<any[]>(
                    "SELECT COUNT(*) as count FROM Folder WHERE parentId = ?",
                    [folder.id]
                );
                const subfolderCount = subfolderCountResult[0]?.count || 0;

                return {
                    ...folder,
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

        return NextResponse.json({ folders: foldersWithCounts, files, breadcrumbs });
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

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        console.log(`DELETE request for ID: ${id}`);
        // Check ownership and system status
        const [rows] = await pool.query<any[]>("SELECT ownerId, isSystem FROM Folder WHERE id = ?", [id]);
        const folder = rows[0];

        if (!folder) {
            console.log(`Item ${id} is not a folder. Checking if file...`);
            // Check if it's a file?
            const [fileRows] = await pool.query<any[]>("SELECT uploadedBy FROM File WHERE id = ?", [id]);
            const file = fileRows[0];
            if (!file) {
                console.log(`Item ${id} not found in Folder or File tables.`);
                return NextResponse.json({ error: "Not found" }, { status: 404 });
            }
            if (file.uploadedBy !== session.user.id) {
                console.log(`Unauthorized File Delete: User ${session.user.id} tried to delete file owned by ${file.uploadedBy}`);
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }

            await pool.query("DELETE FROM File WHERE id = ?", [id]);
            console.log(`File ${id} deleted successfully.`);
            return NextResponse.json({ success: true });
        }

        console.log(`Folder found: ${id}, owner: ${folder.ownerId}, isSystem: ${folder.isSystem}`);
        if (folder.ownerId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        if (folder.isSystem) return NextResponse.json({ error: "System folders cannot be deleted" }, { status: 403 });

        await pool.query("DELETE FROM Folder WHERE id = ?", [id]);
        console.log(`Folder ${id} deleted successfully.`);
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
        if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        if (folder.ownerId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        if (name) {
            if (folder.isSystem) return NextResponse.json({ error: "System folders cannot be renamed" }, { status: 403 });
            await pool.query("UPDATE Folder SET name = ? WHERE id = ?", [name, id]);
        }

        if (isPublic !== undefined) {
            await pool.query("UPDATE Folder SET isPublic = ? WHERE id = ?", [isPublic, id]);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

