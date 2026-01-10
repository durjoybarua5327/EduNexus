"use client";

import { use, useEffect, useState } from "react";
import { FolderBrowser } from "@/components/FolderBrowser";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CourseMaterialsPage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params); // robust unwrapping
    const { courseId } = params;
    const searchParams = useSearchParams();
    const folderId = searchParams.get('folderId');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ folders: any[], files: any[], breadcrumbs: any[] }>({
        folders: [],
        files: [],
        breadcrumbs: []
    });

    useEffect(() => {
        async function fetchMaterials() {
            setLoading(true);
            try {
                // Use central files endpoint which handles folder sync and courseId filtering
                const url = folderId
                    ? `/api/files?courseId=${courseId}&parentId=${folderId}`
                    : `/api/files?courseId=${courseId}`;

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchMaterials();
    }, [courseId, folderId]);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/teacher/courses/${courseId}`} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Course Materials
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Manage files and folders for this course.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 min-h-[500px]">
                    <FolderBrowser
                        folders={data.folders}
                        files={data.files}
                        breadcrumbs={data.breadcrumbs}
                        currentFolderId={folderId}
                        basePath={`/teacher/courses/${courseId}/materials`}
                        allowUploads={true}
                        showPrivacy={true}
                    />
                    {/* Note: FolderBrowser usually renders its own container, but if we need to remove the wrapper above, we can. 
                        Let's fix the nesting. FolderBrowser is a full component. */}
                </div>
            )}
        </div>
    );
}
