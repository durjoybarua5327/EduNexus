import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') === 'null' ? null : searchParams.get('folderId');

    const whereClause: any = {
        parentId: folderId,
        ownerId: session.user.id
    };

    const folders = await prisma.folder.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: { _count: { select: { files: true } } }
    });

    const files = folderId ? await prisma.file.findMany({
        where: { folderId },
        orderBy: { createdAt: 'desc' }
    }) : [];

    let breadcrumbs: any[] = [];
    if (folderId) {
        let current = await prisma.folder.findUnique({ where: { id: folderId } });
        while (current) {
            breadcrumbs.unshift(current);
            if (current.parentId) {
                current = await prisma.folder.findUnique({ where: { id: current.parentId } });
            } else {
                current = null;
            }
        }
    }

    return NextResponse.json({ folders, files, breadcrumbs });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    if (data.type === 'folder') {
        try {
            await prisma.folder.create({
                data: {
                    name: data.name,
                    ownerId: session.user.id,
                    parentId: data.parentId === 'root' ? null : data.parentId,
                    isPublic: data.isPublic
                }
            });
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ error: e }, { status: 500 });
        }
    } else if (data.type === 'file') {
        try {
            await prisma.file.create({
                data: {
                    name: data.name,
                    folderId: data.folderId,
                    url: "/dummy.pdf",
                    type: data.fileType,
                    size: data.fileSize
                }
            });
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ error: "Upload failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
