"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function checkUser() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    return session.user;
}

export async function getFolderContents(folderId: string | null) {
    const user = await checkUser();

    // For now, fetch folders owned by user if student, or course materials if teacher
    // We'll focus on student personal folders first

    const whereClause: any = {
        parentId: folderId,
        ownerId: user.id
    };

    if (folderId === null) {
        // Root folders
        whereClause.parentId = null;
    }

    const folders = await prisma.folder.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: { _count: { select: { files: true } } }
    });

    const files = folderId ? await prisma.file.findMany({
        where: { folderId },
        orderBy: { createdAt: 'desc' }
    }) : [];

    // Also get breadcrumbs if folderId is present
    let breadcrumbs = [];
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

    return { folders, files, breadcrumbs };
}

export async function createFolder(formData: FormData) {
    const user = await checkUser();
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string; // 'null' or id
    const isPublic = formData.get('isPublic') === 'on';

    try {
        await prisma.folder.create({
            data: {
                name,
                ownerId: user.id,
                parentId: parentId === 'root' ? null : parentId,
                isPublic
            }
        });
        revalidatePath('/dashboard/semester'); // Revalidate path
        return { success: true };
    } catch (e) {
        return { error: e };
    }
}

export async function uploadFile(formData: FormData) {
    const user = await checkUser();
    const folderId = formData.get('folderId') as string;
    // In real app, handle file blob upload to S3/Cloudinary/Local
    // Here we just creating a dummy file record
    const file = formData.get('file') as File;
    const name = file.name;

    try {
        await prisma.file.create({
            data: {
                name: name,
                folderId,
                url: "/dummy.pdf", // Placeholder
                type: file.type,
                size: file.size
            }
        });
        revalidatePath('/dashboard/semester');
        return { success: true };
    } catch (e) {
        return { error: "Upload failed" };
    }
}
