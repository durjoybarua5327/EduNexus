"use client";

import { useState } from "react";
import { Megaphone, Loader2, CheckCircle, XCircle, Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { TagInput } from "@/components/TagInput";

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface PostClassNoticeFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: any;
}

export function PostClassNoticeForm({ onSuccess, onCancel, initialData }: PostClassNoticeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate).toISOString().split('T')[0] : "",
        isPinned: initialData?.isPinned || false,
        priority: initialData?.priority || "MEDIUM",
        tags: initialData?.tags || [] as string[]
    });

    const isEditing = !!initialData;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const url = isEditing ? `/api/class-notice/${initialData.id}` : "/api/class-notice";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus('success');
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Notice Title</label>
                        <input
                            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-gray-300 text-lg font-medium"
                            required
                            placeholder="e.g. Exam Schedule Changed"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Details (Rich Text)</label>
                        <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 transition-all bg-white">
                            <div className="h-[40vh] overflow-y-auto custom-scrollbar relative">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={val => setFormData({ ...formData, description: val })}
                                    modules={modules}
                                    className="h-full flex flex-col [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-20 [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[200px]"
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
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm bg-white"
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                <Pin className={`w-5 h-5 ${formData.isPinned ? 'text-violet-500' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">Pin to Top</p>
                                    <p className="text-xs text-gray-500">Keep this notice visible</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500"
                                    checked={formData.isPinned}
                                    onChange={e => setFormData({ ...formData, isPinned: e.target.checked })}
                                />
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
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 font-medium transition-colors">
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                    {loading ? (isEditing ? "Updating..." : "Posting...") : (isEditing ? "Update Notice" : "Post Notice")}
                </button>
            </div>

            {status === 'success' && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4" />
                    Notice posted successfully!
                </div>
            )}

            {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <XCircle className="w-4 h-4" />
                    Failed to post notice. Please try again.
                </div>
            )}
        </form>
    );
}
