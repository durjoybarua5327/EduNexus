"use client";

import { UploadCloud, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/context/user-context";
import { FolderBrowser } from "@/components/FolderBrowser";
import { fetchAPI } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function TeacherUploadsPage() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const folderId = searchParams.get("folderId") || null;

    const [data, setData] = useState<{ folders: any[]; files: any[]; breadcrumbs: any[] }>({
        folders: [],
        files: [],
        breadcrumbs: []
    });
    const [loading, setLoading] = useState(true);

    const fetchFolders = async () => {
        // Only show full loading on first load, otherwise subtle update?
        // Actually for now let's just re-fetch gracefully
        if (!data.folders.length) setLoading(true);

        try {
            const url = folderId
                ? `/files?ownerId=${user?.id}&parentId=${folderId}`
                : `/files?ownerId=${user?.id}`;

            const res = await fetchAPI(url);
            if (res) {
                setData(res);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchFolders();
        }
    }, [user?.id, folderId]);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">
            {/* Minimalist Header */}
            <div className="relative mb-8">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute top-0 right-10 w-24 h-24 bg-violet-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Uploads</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm max-w-lg">
                            Manage your course materials. Folders for your courses are created automatically.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 min-h-[500px]">
                    <FolderBrowser
                        folders={data.folders}
                        files={data.files}
                        breadcrumbs={data.breadcrumbs}
                        currentFolderId={folderId}
                        basePath={`/teacher/uploads`}
                        allowUploads={true} // Enabled so they can upload inside folders
                        showPrivacy={true}
                        onRefresh={fetchFolders}
                    // Note: Permissions to delete system folders are handled by backend & UI checks
                    />
                </div>
            )}
        </div>
    );
}
