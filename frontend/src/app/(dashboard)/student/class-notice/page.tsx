"use client";

import { useUser } from "@/context/user-context";
import { useEffect, useState } from "react";
import { Megaphone, Plus, Loader2, User, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
import { PostClassNoticeForm } from "@/components/cr/PostClassNoticeForm";
import { Modal } from "@/components/Modal";
import toast from "react-hot-toast";
import { NoticeGrid } from "@/components/NoticeSlider";
import { SmallNoticeModal } from "@/components/SmallNoticeModal";

import { ConfirmModal } from "@/components/ConfirmModal";

export default function ClassNoticePage() {
    const { user } = useUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [editingNotice, setEditingNotice] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [filterType, setFilterType] = useState<'TEACHER' | 'CR'>('TEACHER');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; noticeId: string | null }>({ isOpen: false, noticeId: null });

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

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, noticeId: id });
    };

    const handleConfirmDelete = async () => {
        if (!confirmModal.noticeId) return;

        const toastId = toast.loading("Deleting notice...");
        try {
            const res = await fetch(`/api/class-notice/${confirmModal.noticeId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Notice deleted", { id: toastId });
                setNotices(prev => prev.filter(n => n.id !== confirmModal.noticeId));
            } else {
                toast.error("Failed to delete", { id: toastId });
            }
        } catch (error) {
            toast.error("Error deleting notice", { id: toastId });
        } finally {
            setConfirmModal({ isOpen: false, noticeId: null });
        }
    };

    const handleEdit = (notice: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNotice(notice);
        setIsPostModalOpen(true);
    };

    const sortedNotices = [...notices].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const teacherNotices = sortedNotices.filter(n => n.authorRole === 'TEACHER' || n.authorRole === 'DEPT_ADMIN').filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const crNotices = sortedNotices.filter(n => n.authorRole === 'CR' || n.authorRole === 'STUDENT').filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const canPost = user?.role === "CR" || user?.role === "TEACHER" || user?.role === "DEPT_ADMIN";

    const showTeachers = filterType === 'TEACHER' && teacherNotices.length > 0;
    const showCRs = filterType === 'CR' && crNotices.length > 0;
    const noResults = !showTeachers && !showCRs;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-6 pb-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                            <span className="text-slate-900">Class</span> <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Notices</span>
                        </h1>
                        <p className="mt-2 text-base text-slate-500 font-medium">
                            Updates for your batch <span className="mx-2 text-slate-300">•</span> {notices.length} Posts
                        </p>
                    </div>

                    {canPost && (
                        <button
                            onClick={() => {
                                setEditingNotice(null);
                                setIsPostModalOpen(true);
                            }}
                            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-300 font-bold hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                            Post Notice
                        </button>
                    )}
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">

                    {/* Filter Tabs - Only Teachers and CRs */}
                    <div className="flex p-1.5 bg-slate-100 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setFilterType('TEACHER')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${filterType === 'TEACHER'
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <Megaphone className="w-4 h-4" />
                            Teachers
                        </button>
                        <button
                            onClick={() => setFilterType('CR')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                ${filterType === 'CR'
                                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            CRs
                        </button>
                    </div>

                    {/* Right Side: Sort & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">

                        {/* Sort Toggle */}
                        <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => setSortOrder('newest')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${sortOrder === 'newest'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <ArrowUp className={`w-3.5 h-3.5 ${sortOrder === 'newest' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                Newest
                            </button>
                            <button
                                onClick={() => setSortOrder('oldest')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${sortOrder === 'oldest'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <ArrowDown className={`w-3.5 h-3.5 ${sortOrder === 'oldest' ? 'rotate-0' : 'rotate-180'} transition-transform`} />
                                Oldest
                            </button>
                        </div>

                        {/* Search Bar - Enhanced Visibility */}
                        <div className="relative w-full sm:w-72 xl:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search notices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 border-2 border-indigo-100 rounded-xl leading-5 bg-indigo-50/30 text-slate-900 placeholder-indigo-300 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 font-medium sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Teachers Section */}
                    {showTeachers && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <NoticeGrid
                                title="From Teachers"
                                notices={teacherNotices}
                                onSelect={setSelectedNotice}
                                icon={<Megaphone className="w-6 h-6" />}
                                color="indigo"
                                onDelete={canPost ? handleDeleteClick : undefined}
                                onEdit={canPost ? handleEdit : undefined}
                                currentUserId={user?.id}
                            />
                        </div>
                    )}

                    {/* CR Section */}
                    {showCRs && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <NoticeGrid
                                title="From Class Representatives"
                                notices={crNotices}
                                onSelect={setSelectedNotice}
                                icon={<User className="w-6 h-6" />}
                                color="emerald"
                                onDelete={canPost ? handleDeleteClick : undefined}
                                onEdit={canPost ? handleEdit : undefined}
                                currentUserId={user?.id}
                            />
                        </div>
                    )}

                    {noResults && (
                        <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-600">No notices found</h3>
                            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Post/Edit Notice Modal */}
            <Modal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                title={editingNotice ? "Edit Notice" : "Create New Notice"}
                maxWidth="max-w-6xl"
            >
                <PostClassNoticeForm
                    initialData={editingNotice}
                    onSuccess={() => {
                        setIsPostModalOpen(false);
                        fetchNotices(); // Live update
                    }}
                    onCancel={() => setIsPostModalOpen(false)}
                />
            </Modal>

            {/* Small Detail Modal */}
            <SmallNoticeModal
                isOpen={!!selectedNotice}
                onClose={() => setSelectedNotice(null)}
                notice={selectedNotice}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, noticeId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Notice"
                message="Are you sure you want to delete this notice? This action cannot be undone."
                confirmText="Delete"
                confirmColor="bg-rose-600 hover:bg-rose-700"
            />
        </div>
    );
}
