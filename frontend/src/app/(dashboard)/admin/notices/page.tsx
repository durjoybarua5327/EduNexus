"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Bell, Trash2, Calendar, MapPin, Pin, Edit } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { TagInput } from "@/components/TagInput";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function NoticesPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const deptId = session?.user?.departmentId;

    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        expiryDate: "",
        isPinned: false,
        tags: [] as string[]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        if (deptId) fetchNotices();
    }, [deptId]);

    async function fetchNotices() {
        try {
            const res = await fetch(`/api/dept/notices?departmentId=${deptId}`);
            if (res.ok) setNotices(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isSubmitting) return;

        const now = Date.now();
        if (!editId && now - lastSubmitTime < 2000) {
            toast.error("Please wait a moment before posting again.");
            return;
        }

        setIsSubmitting(true);

        try {
            // @ts-ignore
            const userId = session?.user?.id;

            const method = editId ? "PUT" : "POST";
            const body = { ...formData, departmentId: deptId, actorId: userId, id: editId };

            const res = await fetch("/api/dept/notices", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setLastSubmitTime(Date.now());
                toast.success(editId ? "Notice updated" : "Notice posted successfully");
                handleCloseModal();
                fetchNotices();
            } else {
                const err = await res.json();
                toast.error(err.error || `Failed to ${editId ? 'update' : 'post'} notice`);
            }
        } catch (e) { toast.error("An error occurred"); }
        finally {
            setIsSubmitting(false);
        }
    }

    function handleEdit(notice: any) {
        setFormData({
            title: notice.title,
            description: notice.description,
            expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : "",
            isPinned: notice.isPinned,
            tags: notice.tags || []
        });
        setEditId(notice.id);
        setIsAddOpen(true);
    }

    function handleCloseModal() {
        setIsAddOpen(false);
        setEditId(null);
        setFormData({ title: "", description: "", expiryDate: "", isPinned: false, tags: [] });
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleDelete(id: string) {
        setConfirmAction({
            title: "Delete Notice",
            message: "Are you sure you want to delete this notice? This action cannot be undone.",
            isDanger: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/notices?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Notice deleted");
                        fetchNotices();
                    } else {
                        toast.error("Failed to delete notice");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("An error occurred");
                }
            }
        });
    }

    if (!deptId) return null;

    // React Quill Modules for Toolbar
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
                    <p className="text-gray-500 text-sm">Announcements & Updates</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Create Post
                </button>
            </div>

            {loading ? <div className="text-center py-10 text-gray-500">Loading feeds...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map(notice => (
                        <div
                            key={notice.id}
                            onClick={() => setSelectedNotice(notice)}
                            className={`bg-white rounded-xl shadow-sm border ${notice.isPinned ? 'border-indigo-500 shadow-indigo-100' : 'border-gray-100'} overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col h-[320px] group`}
                        >

                            {/* Card Header: Author & Options */}
                            <div className="px-5 pt-5 pb-2 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-50">
                                        D
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-xs">Dept. Admin</h4>
                                        <p className="text-[10px] text-gray-500">
                                            {new Date(notice.createdAt).toLocaleDateString()}
                                            {notice.isPinned && (
                                                <span className="block text-indigo-600 font-bold flex items-center gap-0.5 mt-0.5">
                                                    <Pin className="w-3 h-3" /> Pinned
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(notice); }}
                                        className="text-gray-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body: Preview Content */}
                            <div className="px-5 flex-1 relative overflow-hidden">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2">{notice.title}</h3>

                                <div
                                    className="prose prose-sm max-w-none text-gray-500 text-xs line-clamp-4 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: notice.description }}
                                />
                                {/* Bottom Fade Effect */}
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            </div>

                            {/* Card Footer: Tags & Meta */}
                            <div className="px-5 py-4 mt-auto border-t border-gray-50 bg-gray-50/30">
                                <div className="flex flex-wrap gap-1 mb-2 h-6 overflow-hidden">
                                    {notice.tags && notice.tags.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-medium rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                    {notice.tags && notice.tags.length > 3 && (
                                        <span className="text-[10px] text-gray-400 py-0.5">+{notice.tags.length - 3}</span>
                                    )}
                                </div>
                                {notice.expiryDate && (
                                    <div className="flex items-center gap-1 text-[10px] text-orange-600 font-medium">
                                        <Calendar className="w-3 h-3" />
                                        Exp: {new Date(notice.expiryDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {notices.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No notices yet</h3>
                            <p className="text-gray-500 text-sm mt-1">Create your first post to verify the new design!</p>
                        </div>
                    )}
                </div>
            )}

            {/* View Notice Detail Modal */}
            <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title="" maxWidth="max-w-7xl">
                {selectedNotice && (
                    <div className="h-full flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    D
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Department Admin</h2>
                                    <p className="text-sm text-gray-500">
                                        {new Date(selectedNotice.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                            {!!selectedNotice.isPinned && (
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Pinned
                                </span>
                            )}
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            <h1 className="text-4xl font-bold text-gray-900 mb-8">{selectedNotice.title}</h1>

                            <div
                                className="prose prose-xl max-w-none text-gray-700 quill-content"
                                dangerouslySetInnerHTML={{ __html: selectedNotice.description }}
                            />

                            {/* Tags */}
                            {selectedNotice.tags && selectedNotice.tags.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedNotice.tags.map((tag: string) => (
                                            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedNotice.expiryDate && (
                                <div className="mt-6 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg inline-flex">
                                    <Calendar className="w-4 h-4" />
                                    Expires on: {new Date(selectedNotice.expiryDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => { handleEdit(selectedNotice); setSelectedNotice(null); }}
                                className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium border border-transparent hover:border-indigo-100"
                            >
                                <Edit className="w-4 h-4" /> Edit Post
                            </button>
                            <button
                                onClick={() => setSelectedNotice(null)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Create/Edit Post Modal */}
            <Modal isOpen={isAddOpen} onClose={handleCloseModal} title={editId ? "Edit Post" : "Create Post"} maxWidth="max-w-4xl">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto max-h-[60vh] p-1">

                        {/* User Profile Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {session?.user?.name?.[0] || 'A'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{session?.user?.name || 'Department Admin'}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Bell className="w-3 h-3" /> Public
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Title Input */}
                        <div className="mb-4">
                            <input
                                className="w-full text-xl font-bold placeholder-gray-400 border-none focus:ring-0 outline-none p-0"
                                required
                                placeholder="Title of your notice..."
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Rich Text Editor */}
                        <div className="mb-4">
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                modules={modules}
                                placeholder="What's on your mind?"
                                className="h-64 mb-12 quill-content-preserved"
                            />
                        </div>

                        {/* Tags & Options */}
                        <div className="border rounded-xl p-4 space-y-4 bg-gray-50 mt-8">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Tags</label>
                                <TagInput tags={formData.tags} setTags={(tags) => setFormData({ ...formData, tags })} />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expires (Optional)</label>
                                    <input type="date" className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="pin" className="w-4 h-4 text-indigo-600 rounded"
                                    checked={formData.isPinned} onChange={e => setFormData({ ...formData, isPinned: e.target.checked })} />
                                <label htmlFor="pin" className="text-sm text-gray-700 font-medium">Pin to top of board</label>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 font-medium w-full md:w-auto" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold w-full md:w-auto shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
                            {isSubmitting ? (editId ? 'Updating...' : 'Posting...') : (editId ? 'Update' : 'Post')}
                        </button>
                    </div>
                </form>
            </Modal>



            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure?"}
                onConfirm={confirmAction?.onConfirm || (() => { })}
                isDanger={confirmAction?.isDanger}
                confirmText={confirmAction?.confirmText}
            />
        </div >
    );
}
