
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
    const files = formData.getAll('file') as File[]; // Get all files
    const path = formData.get('path') as string;
    const isPublic = formData.get('isPublic') === 'on';

    if (!files || files.length === 0) {
        return { error: "No files provided" };
    }

    try {
        const uploadPromises = files.map(async (file) => {
            // 1. Upload file to storage
            const uploadFormData = new FormData();
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileBlob = new Blob([buffer], { type: file.type });

            uploadFormData.append('file', fileBlob, file.name);

            const baseUrl = 'http://127.0.0.1:3001/api/upload';

            const uploadRes = await fetch(baseUrl, {
                method: 'POST',
                body: uploadFormData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error || `Failed to upload ${file.name}`);
            }

            const { url } = await uploadRes.json();

            // 2. Save metadata to DB
            const res = await fetchAPI('/files', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'file',
                    name: file.name,
                    folderId,
                    fileType: file.type,
                    size: file.size,
                    url: url,
                    isPublic
                })
            });

            if (res.error) throw new Error(res.error);
            return { success: true, name: file.name };
        });

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

        revalidatePath(path || '/student/profile');
        return { success: true };

    } catch (e: any) {
        console.error(e);
        return { error: e.message || "One or more uploads failed" };
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
        revalidatePath('/student/resources');
        revalidatePath('/', 'layout'); // strong revalidation
        return { success: true };
    } catch (e) {
        return { error: "Update Failed" };
    }
}
