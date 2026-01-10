
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
        // 1. Upload file to storage first
        const uploadFormData = new FormData();
        // Convert file to Blob for Node-fetch compatibility if needed, 
        // or just append if environment supports it. 
        // Safer way in Server Action (Node) to External API:
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileBlob = new Blob([buffer], { type: file.type });

        uploadFormData.append('file', fileBlob, file.name);

        // Improve: Use full URL if fetchAPI doesn't handle absolute URLs for external calls, 
        // but here we are calling our own backend route. 
        // We'll use a direct fetch to the upload endpoint since fetchAPI adds JSON headers by default 
        // and we need multipart/form-data (which fetch handles automatically if body is FormData).

        // We need to determine the base URL. On server actions relative URLs might fail if not configured.
        // Let's try relative first, or constructs full URL.
        const baseUrl = 'http://127.0.0.1:3001/api/upload';

        const uploadRes = await fetch(baseUrl, {
            method: 'POST',
            body: uploadFormData,
            // Do NOT set Content-Type header, let browser/fetch set boundary
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.json();
            return { error: err.error || "File upload failed" };
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
                url: url // Use the real URL from backend
            })
        });

        if (res.error) return { error: res.error };

        revalidatePath(path || '/student/profile');
        return res;
    } catch (e) {
        console.error(e);
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
        revalidatePath('/student/resources');
        revalidatePath('/', 'layout'); // strong revalidation
        return { success: true };
    } catch (e) {
        return { error: "Update Failed" };
    }
}
