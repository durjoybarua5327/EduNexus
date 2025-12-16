"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { fetchAPI } from "@/lib/api";

export async function createFolder(formData: FormData) {
    const parentId = formData.get('parentId') as string;
    const name = formData.get('name') as string;
    const isPublic = formData.get('isPublic') === 'on';

    const session = await auth();
    // In real app pass token

    try {
        const res = await fetch('http://localhost:3001/api/files', {
            method: 'POST',
            body: JSON.stringify({
                type: 'folder',
                name,
                parentId,
                isPublic,
                ownerId: session?.user?.id
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        revalidatePath('/dashboard/semester');
        return data;
    } catch (e) {
        return { error: "Connection Failed" };
    }
}

export async function uploadFile(formData: FormData) {
    // Handling file upload in BFF is tricky with JSON body.
    // Ideally we stream the file to backend or use FormData if Backend accepts it.
    // Our Backend API implementation for 'files' accepts JSON in 'POST' - wait, I implemented it to read JSON!
    // But files are binary.
    // My backend implementation: `const data = await req.json();`
    // So I need to send JSON. Since it's a dummy text-only "upload", I can just send metadata.

    const folderId = formData.get('folderId') as string;
    const file = formData.get('file') as File;

    try {
        const res = await fetch('http://localhost:3001/api/files', {
            method: 'POST',
            body: JSON.stringify({
                type: 'file',
                name: file.name,
                folderId,
                fileType: file.type,
                fileSize: file.size
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        revalidatePath('/dashboard/semester');
        return data;
    } catch (e) {
        return { error: "Upload Connection Failed" };
    }
}

export async function getFolderContents(folderId: string | null) {
    // This is a server action used by server component, or just a helper?
    // In Server Component we can just call fetchAPI directly.
    // But if we want to reuse logic:
    const query = folderId ? `?folderId=${folderId}` : '?folderId=null';
    return await fetchAPI(`/files${query}`);
}
