"use client";

import { Megaphone, Bell, CalendarClock, Pin, Loader2, Plus } from "lucide-react";
import { NoticeFeed } from "@/components/NoticeFeed";
import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import PostTeacherNoticeForm from "@/components/PostTeacherNoticeForm";
import { useUser } from "@/context/user-context";

export default function GenericTeacherNoticesPage() {
    const { user } = useUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        async function fetchAllNotices() {
            try {
                const res = await fetch('/api/teacher/notices');
                // Note: Ideally this endpoint returns all notices authored by this teacher
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
        fetchAllNotices();
    }, [isCreateModalOpen]); // Refresh when modal closes

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">
            {/* Minimalist Header */}
            <div className="relative mb-8">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute top-0 right-10 w-24 h-24 bg-fuchsia-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">Notices</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm max-w-lg">
                            Broadcast announcements to your classes.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5 text-fuchsia-600" />
                        New Notice
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-fuchsia-600" />
                </div>
            ) : notices.length > 0 ? (
                <NoticeFeed notices={notices} />
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 min-h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Bell className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No Notices Posted</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">Create announcements for your courses here.</p>
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Notice" maxWidth="max-w-6xl">
                <PostTeacherNoticeForm />
            </Modal>
        </div>
    );
}
