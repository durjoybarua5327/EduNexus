
"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { fetchAPI } from "@/lib/api";

export async function createFolder(formData: FormData) {
    const parentId = formData.get('parentId') as string;
    const name = formData.get('name') as string;
    const isPublic = formData.get('isPublic') === 'on';
    const path = formData.get('path') as string; // Dynamic path for revalidation

    const session = await auth();

    try {
        const res = await fetchAPI('/files', {
            method: 'POST',
            body: JSON.stringify({
                type: 'folder',
                name,
                parentId,
                isPublic,
                ownerId: session?.user?.id
            })
        });

        if (res.error) return { error: res.error };

        revalidatePath(path || '/student/profile');
        return res;
    } catch (e) {
        return { error: "Connection Failed" };
    }
}

export async function uploadFile(formData: FormData) {
    const folderId = formData.get('folderId') as string;
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    try {
        const res = await fetchAPI('/files', {
            method: 'POST',
            body: JSON.stringify({
                type: 'file',
                name: file.name,
                folderId,
                fileType: file.type,
                fileSize: file.size,
                url: URL.createObjectURL(file) // Mock URL for now
            })
        });

        if (res.error) return { error: res.error };

        revalidatePath(path || '/student/profile');
        return res;
    } catch (e) {
        return { error: "Upload Connection Failed" };
    }
}

export async function getFolderContents(parentId: string | null, ownerId?: string, courseId?: string) {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    if (ownerId) params.append('ownerId', ownerId);
    if (courseId) params.append('courseId', courseId);

    return await fetchAPI(`/files?${params.toString()}`);
}


export async function deleteItem(id: string) {
    try {
        const res = await fetchAPI(`/files?id=${id}`, {
            method: 'DELETE'
        });

        if (res.error) return { error: res.error };

        // Revalidate all related paths
        revalidatePath('/student/profile');
        revalidatePath('/student/resources');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e) {
        return { error: "Delete Failed" };
    }
}

export async function updateFolder(id: string, data: { name?: string, isPublic?: boolean }) {
    try {
        const res = await fetchAPI('/files', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...data })
        });

        if (res.error) return { error: res.error };

        revalidatePath('/student/profile');
        return { success: true };
    } catch (e) {
        return { error: "Update Failed" };
    }
}
