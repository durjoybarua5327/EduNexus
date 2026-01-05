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

    const [lastSubmitTime, setLastSubmitTime] = useState(0);

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

        const now = Date.now();
        if (now - lastSubmitTime < 5000) {
            toast.error(`Please wait ${Math.ceil((5000 - (now - lastSubmitTime)) / 1000)}s before posting again.`);
            return;
        }

        try {
            // @ts-ignore
            const userId = session?.user?.id;
            const res = await fetch("/api/dept/notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, departmentId: deptId, actorId: userId }),
            });
            if (res.ok) {
                setLastSubmitTime(Date.now());
                toast.success("Notice posted");
                setIsAddOpen(false);
                setFormData({ title: "", description: "", expiryDate: "", isPinned: false, tags: [] });
                fetchNotices();
            } else {
                toast.error("Failed to post notice");
            }
        } catch (e) { toast.error("An error occurred"); }
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
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
                    <p className="text-gray-500">Post announcements for students and faculty.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Post Notice
                </button>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="space-y-6">
                    {notices.map(notice => (
                        <div key={notice.id} className={`bg-white p-6 rounded-xl shadow-sm border ${notice.isPinned ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'} hover:shadow-md transition-all relative group`}>
                            {notice.isPinned && (
                                <div className="absolute top-4 right-4 text-indigo-500" title="Pinned Notice">
                                    <Pin className="w-5 h-5 fill-current" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="text-xs text-gray-400">
                                            {new Date(notice.createdAt).toLocaleDateString()}
                                        </span>

                                        {/* Display Tags */}
                                        {notice.tags && notice.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {notice.tags.map((tag: string) => (
                                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{notice.title}</h3>

                                    {/* Rich Text Content */}
                                    <div
                                        className="prose prose-sm max-w-none text-gray-600 quill-content"
                                        dangerouslySetInnerHTML={{ __html: notice.description }}
                                    />
                                </div>
                                <div className="flex items-start pl-4 min-w-[30px]">
                                    <button onClick={() => handleDelete(notice.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {notice.expiryDate && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-orange-600 font-medium">
                                    <Calendar className="w-3 h-3" /> Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    ))}
                    {notices.length === 0 && (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            No active notices.
                        </div>
                    )}
                </div>
            )}

            {/* Create Post Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Post" maxWidth="max-w-4xl">
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
                        <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 font-medium w-full md:w-auto">Cancel</button>
                        <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold w-full md:w-auto shadow-lg shadow-indigo-200">Post</button>
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
