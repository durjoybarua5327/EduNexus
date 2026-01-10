"use client";

import { useUser } from "@/context/user-context";
import { NoticeFeed } from "@/components/NoticeFeed";
import { useEffect, useState } from "react";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { PostClassNoticeForm } from "@/components/cr/PostClassNoticeForm";
import { Modal } from "@/components/Modal";
import toast from "react-hot-toast";

export default function ClassNoticePage() {
    const { user } = useUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const fetchNotices = async () => {
        try {
            const res = await fetch("/api/class-notice");
            const data = await res.json();
            if (data.notices) {
                setNotices(data.notices);
            }
        } catch (error) {
            console.error("Failed to fetch notices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal opening
        if (!confirm("Are you sure you want to delete this notice?")) return;

        const toastId = toast.loading("Deleting notice...");
        try {
            const res = await fetch(`/api/class-notice/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Notice deleted", { id: toastId });
                setNotices(prev => prev.filter(n => n.id !== id));
            } else {
                toast.error("Failed to delete", { id: toastId });
            }
        } catch (error) {
            toast.error("Error deleting notice", { id: toastId });
        }
    };

    const isCR = user?.role === "CR";

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                        <span className="text-slate-900">Class</span> <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Notices</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium">
                        Updates for your batch <span className="mx-2 text-slate-300">•</span> {notices.length} Posts
                    </p>
                </div>

                {isCR && (
                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-300 font-bold hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        Post Notice
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
            ) : (
                <NoticeFeed notices={notices} onDelete={isCR ? handleDelete : undefined} />
            )}

            {/* Post Notice Modal (CR Only) */}
            <Modal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                title="Create New Notice"
                maxWidth="max-w-6xl"
            >
                <PostClassNoticeForm
                    onSuccess={() => {
                        setIsPostModalOpen(false);
                        fetchNotices();
                    }}
                    onCancel={() => setIsPostModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
