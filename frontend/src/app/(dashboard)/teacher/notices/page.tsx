"use client";

import { Megaphone, Bell, CalendarClock, Pin, Loader2, Plus, Trash2 } from "lucide-react";
import { NoticeFeed } from "@/components/NoticeFeed";
import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import PostTeacherNoticeForm from "@/components/PostTeacherNoticeForm";
import EditTeacherNoticeForm from "@/components/EditTeacherNoticeForm";
import { useUser } from "@/context/user-context";

export default function GenericTeacherNoticesPage() {
    const { user } = useUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<any | null>(null);
    const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);

    const fetchNotices = async () => {
        try {
            const res = await fetch('/api/teacher/notices');
            if (res.ok) {
                const data = await res.json();
                setNotices(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    const handleNoticeCreated = () => {
        setIsCreateModalOpen(false);
        setLoading(true);
        fetchNotices();
    };

    const handleNoticeUpdated = () => {
        setIsEditModalOpen(false);
        setEditingNotice(null);
        setLoading(true);
        fetchNotices();
    };

    const handleEditClick = (notice: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNotice(notice);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (noticeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingNoticeId(noticeId);
    };

    const confirmDelete = async () => {
        if (!deletingNoticeId) return;

        try {
            const response = await fetch(`/api/class-notice/${deletingNoticeId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove from local state
                setNotices(prev => prev.filter(n => n.id !== deletingNoticeId));
                setDeletingNoticeId(null);
            } else {
                const error = await response.json();
                console.error("Failed to delete notice:", error);
                alert("Failed to delete notice. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting notice:", error);
            alert("An error occurred while deleting the notice.");
        }
    };

    const cancelDelete = () => {
        setDeletingNoticeId(null);
    };

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
                <NoticeFeed
                    notices={notices}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    currentUserId={user?.id}
                />
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 min-h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Bell className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No Notices Posted</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">Create announcements for your courses here.</p>
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Notice" maxWidth="max-w-6xl">
                <PostTeacherNoticeForm onSuccess={handleNoticeCreated} />
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Notice" maxWidth="max-w-6xl">
                {editingNotice && <EditTeacherNoticeForm notice={editingNotice} onSuccess={handleNoticeUpdated} />}
            </Modal>

            {/* Delete Confirmation Dialog */}
            {deletingNoticeId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-rose-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Notice?</h3>
                        <p className="text-slate-600 text-center mb-6">
                            This action cannot be undone. The notice will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
