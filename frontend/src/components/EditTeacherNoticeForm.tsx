"use client";

import { useState, useEffect, useRef } from "react";
import { Megaphone, Loader2, CheckCircle, XCircle, Pin, UploadCloud, FolderLock, FolderOpen } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="h-40 bg-slate-50 flex items-center justify-center text-slate-400">Loading editor...</div>
});

interface EditTeacherNoticeFormProps {
    notice: any;
    onSuccess?: () => void;
}

export default function EditTeacherNoticeForm({ notice, onSuccess }: EditTeacherNoticeFormProps) {
    const [description, setDescription] = useState(notice.description || "");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        setLoading(true);
        setStatus('idle');

        try {
            const formData = new FormData(form);
            const title = formData.get("title") as string;
            const priority = (formData.get("priority") as string) || "MEDIUM";
            const isPinned = formData.get("isPinned") === "on";

            const requestBody = {
                title,
                description,
                priority,
                isPinned,
            };



            // Make the actual API call
            const response = await fetch(`/api/class-notice/${notice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update notice');
            }


            setStatus('success');

            // Call onSuccess callback if provided
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setTimeout(() => setStatus('idle'), 5000);
            }

        } catch (error) {
            console.error("Error updating notice:", error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Content */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Title</label>
                    <input
                        name="title"
                        required
                        type="text"
                        defaultValue={notice.title}
                        placeholder="e.g. Mid-Term Exam Syllabus"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg font-medium placeholder:text-slate-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Details</label>
                    <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 transition-all bg-white shadow-sm">
                        <div className="h-[50vh] overflow-y-auto custom-scrollbar relative">
                            <ReactQuill
                                theme="snow"
                                value={description}
                                onChange={setDescription}
                                modules={modules}
                                className="h-full flex flex-col [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-20 [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[200px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Settings */}
            <div className="lg:col-span-1 space-y-6">
                {/* Target Courses - Display Only */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Target Courses</label>
                    <div className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-amber-800">Cannot be changed after posting</p>
                    </div>
                </div>

                {/* Configurations */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Settings</label>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <input
                            type="checkbox"
                            name="isPinned"
                            id="isPinned"
                            defaultChecked={notice.isPinned}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isPinned" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">Pin to Top</label>
                        <Pin className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <label htmlFor="priority" className="text-sm font-medium text-slate-700 flex-1">Priority</label>
                        <select
                            name="priority"
                            defaultValue={notice.priority}
                            className="text-sm bg-transparent font-bold text-slate-600 outline-none cursor-pointer"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                        {loading ? "Updating..." : "Update Notice"}
                    </button>

                    {(status === 'success' || status === 'error') && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2
                                 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {status === 'success' ? "Notice updated successfully!" : "Failed to update notice."}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
