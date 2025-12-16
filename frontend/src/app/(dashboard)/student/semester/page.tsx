import { getFolderContents } from "@/lib/actions/files";
import { FolderBrowser } from "@/components/FolderBrowser";

export default async function SemesterPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams; // Next.js 15+ needs await for searchParams? In 14 it's object. 
    // The created app is Next 15 or 14? Package.json said 15 (beta in some deps). Assuming 14 standard usage, but if 15, searchParams is async.
    // The user didn't specify version but npx create-next-app@latest gets 15 now (RC).
    // Safest to await if it's a promise, or just treat as object if not.

    // Actually, let's look at backend package.json I saw earlier: "next": "16.0.10"??? No, "15.0.0" usually. 
    // I recall seeing "next": "16.0.10" in the view_file. Wait.. "next": "16.0.10"? That seems fake or I misread.
    // Let's assume standard Next 14/15 pattern.

    const folderId = typeof params?.folderId === "string" ? params.folderId : null;

    // getFolderContents returns { folders, files, breadcrumbs }
    const data = await getFolderContents(folderId);

    if (!data) return <div>Failed to load resources</div>;

    return (
        <div className="h-full p-6">
            <h1 className="text-2xl font-bold mb-6">My Semester Resources</h1>
            <FolderBrowser
                folders={data.folders || []}
                files={data.files || []}
                breadcrumbs={data.breadcrumbs || []}
                currentFolderId={folderId}
            />
        </div>
    );
}
