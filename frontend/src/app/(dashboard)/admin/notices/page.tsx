"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/user-context";
import { Plus, Bell, Calendar, Pin, Archive, Trash2, Edit3, Tag, X, Megaphone, Clock } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import toast from "react-hot-toast";
import { TagInput } from "@/components/TagInput";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function NoticesPage() {
    const { data: session } = useSession();
    const { user } = useUser();
    // @ts-ignore
    const deptId = user?.departmentId || (session?.user as any)?.departmentId;

    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingNotice, setEditingNotice] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        expiryDate: "",
        isPinned: false,
        tags: [] as string[]
    });

    useEffect(() => {
        if (deptId) fetchNotices();
    }, [deptId]);

    async function fetchNotices() {
        try {
            const res = await fetch(`/api/dept/notices?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setNotices(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const body = editMode
                ? { ...formData, id: editingNotice.id, departmentId: deptId }
                : { ...formData, departmentId: deptId };

            const res = await fetch("/api/dept/notices", {
                method: editMode ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(editMode ? "Notice updated" : "Notice posted");
                setIsModalOpen(false);
                setEditMode(false);
                setEditingNotice(null);
                setFormData({ title: "", description: "", expiryDate: "", isPinned: false, tags: [] });
                fetchNotices();
            } else {
                toast.error("Failed to save notice");
            }
        } catch (e) { toast.error("Error occurred"); }
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
                        toast.error("Failed to delete");
                    }
                } catch (e) { toast.error("Error deleting"); }
            }
        });
    }

    function openEdit(notice: any) {
        setEditingNotice(notice);
        setFormData({
            title: notice.title,
            description: notice.description,
            expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : "", // Corrected key from expiresAt to expiryDate
            isPinned: notice.isPinned,
            tags: notice.tags // Assuming tags is already an array of strings or handled correctly by TagInput
        });
        setEditMode(true);
        setIsModalOpen(true);
    }

    // if (!deptId) return null;

    // React Quill Modules for Toolbar
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-white to-orange-50/50 p-6 rounded-3xl border border-white/50 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-200 text-white">
                        <Megaphone className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notice Board</h1>
                        <p className="text-gray-500 font-medium mt-1">Announcements and important updates for students.</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditMode(false); setFormData({ title: "", description: "", expiryDate: "", isPinned: false, tags: [] }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 font-semibold"
                >
                    <Plus className="w-5 h-5" /> Post Notice
                </button>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notices.map(notice => (
                        <div key={notice.id} className={`p-6 rounded-3xl border transition-transform transition-shadow duration-300 will-change-transform group hover:-translate-y-1 hover:shadow-xl relative overflow-hidden flex flex-col ${notice.isPinned ? 'bg-orange-50/30 border-orange-100 shadow-orange-100/50' : 'bg-white border-gray-100 shadow-sm'}`}>
                            {!!notice.isPinned && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-100 to-transparent px-4 py-1.5 rounded-bl-2xl">
                                    <Pin className="w-4 h-4 text-orange-600 inline-block mr-1" />
                                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Pinned</span>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors pr-8">
                                    {notice.title}
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {notice.tags && notice.tags.map((tag: any, idx: number) => (
                                    <span key={idx} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium shadow-sm flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-gray-400" /> {typeof tag === 'string' ? tag : tag.name}
                                    </span>
                                ))}
                            </div>

                            <div className="prose prose-sm text-gray-600 mb-6 line-clamp-3" dangerouslySetInnerHTML={{ __html: notice.description }} />

                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4 text-gray-500">
                                    <div className="flex items-center gap-1.5" title="Posted Date">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {notice.expiryDate && (
                                        <div className={`flex items-center gap-1.5 ${new Date(notice.expiryDate) < new Date() ? 'text-red-500 font-medium' : ''}`} title="Expiry Date">
                                            <Clock className="w-4 h-4" />
                                            <span>{new Date(notice.expiryDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(notice)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(notice.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {notices.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No notices posted</h3>
                            <p className="text-gray-500 mt-1">Keep students updated by posting your first notice.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditMode(false); setEditingNotice(null); }} title={editMode ? "Edit Notice" : "Post New Notice"} maxWidth="max-w-6xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Notice Title</label>
                                <input className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-300 text-lg font-medium"
                                    required placeholder="e.g. Mid-Term Examination Schedule"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                                <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 transition-all bg-white">
                                    <div className="h-[60vh] overflow-y-auto custom-scrollbar relative">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.description}
                                            onChange={val => setFormData({ ...formData, description: val })}
                                            modules={modules}
                                            className="h-full flex flex-col [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-20 [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[300px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 h-fit">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Configurations</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                                        <input type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                                            value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                        <Pin className={`w-5 h-5 ${formData.isPinned ? 'text-orange-500' : 'text-gray-400'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Pin to Top</p>
                                            <p className="text-xs text-gray-500">Keep this notice visible</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                            checked={formData.isPinned} onChange={e => setFormData({ ...formData, isPinned: e.target.checked })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                                <TagInput
                                    tags={formData.tags}
                                    setTags={newTags => setFormData({ ...formData, tags: newTags })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={() => { setIsModalOpen(false); setEditMode(false); }} className="px-5 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-bold shadow-lg shadow-gray-200 transition-all hover:-translate-y-0.5">
                            {editMode ? "Update Notice" : "Post Notice"}
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
        </div>
    );
}
