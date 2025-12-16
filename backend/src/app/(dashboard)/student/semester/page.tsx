import { getFolderContents } from "@/lib/actions/files";
import { FolderBrowser } from "@/components/files/FolderBrowser";

export default async function SemesterPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const folderId = typeof searchParams?.folderId === "string" ? searchParams.folderId : null;
    const { folders, files, breadcrumbs } = await getFolderContents(folderId);

    return (
        <div className="h-full">
            <h1 className="text-2xl font-bold mb-6">My Semester Resources</h1>
            <FolderBrowser
                folders={folders}
                files={files}
                breadcrumbs={breadcrumbs}
                currentFolderId={folderId}
            />
        </div>
    );
}
