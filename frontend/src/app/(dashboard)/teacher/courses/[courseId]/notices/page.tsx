"use client";

import { use, useEffect, useState } from "react";
import { NoticeFeed } from "@/components/NoticeFeed";
import { Loader2, ArrowLeft, Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";

export default function CourseNoticesPage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const { courseId } = params;
    const { user } = useUser();

    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotices() {
            try {
                const res = await fetch(`/api/courses/${courseId}/notices`);
                if (res.ok) {
                    const data = await res.json();
                    setNotices(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchNotices();
    }, [courseId]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this notice?")) return;

        // Optimistic update
        setNotices(prev => prev.filter(n => n.id !== id));
        // API Call would go here
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/teacher/courses/${courseId}`} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Class Notices
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Announcements for this course.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <Plus className="w-5 h-5" />
                        Create Notice
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <NoticeFeed notices={notices} onDelete={handleDelete} />
            )}
        </div>
    );
}
