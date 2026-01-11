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

interface PostTeacherNoticeFormProps {
    onSuccess?: () => void;
}

/**
 * PostTeacherNoticeForm: A specialized form for teachers to broadcast notices to specific courses/batches.
 */
export default function PostTeacherNoticeForm({ onSuccess }: PostTeacherNoticeFormProps = {}) {
    // --- State Management ---
    const [courses, setCourses] = useState<any[]>([]);
    const [fetchingCourses, setFetchingCourses] = useState(true);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<{ file?: File; name: string; isPrivate: boolean }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ReactQuill configuration
    const editorModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    // --- Effects ---
    useEffect(() => {
        const loadTeacherCourses = async () => {
            try {
                const data = await fetchAPI('/teacher/courses');
                if (Array.isArray(data)) {
                    setCourses(data);
                }
            } catch (error) {
                // The provided snippet contained server-side Zod error handling and NextResponse,
                // which are not applicable in a client-side React component.
                // Keeping the original client-side error handling for fetchAPI.
                console.error("Failed to load teacher courses:", error);
            } finally {
                setFetchingCourses(false);
            }
        };
        loadTeacherCourses();
    }, []);

    // --- Event Handlers ---

    const handleFileSelect = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const file = e.target.files[0];
            setUploadedFiles(prev => [...prev, { file, name: file.name, isPrivate: false }]);
        }
        if (e.target) e.target.value = ''; // Clear for re-selection
    };

    const toggleFilePrivacy = (index: number) => {
        setUploadedFiles(prev => prev.map((file, i) => i === index ? { ...file, isPrivate: !file.isPrivate } : file));
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCourseSelection = (courseId: string) => {
        setSelectedCourses(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    };

    const handleToggleAllCourses = () => {
        setSelectedCourses(selectedCourses.length === courses.length ? [] : courses.map(c => c.id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formElement = e.currentTarget;

        setLoading(true);
        setStatus('idle');
        setErrorMessage("");

        try {
            const formData = new FormData(formElement);
            const title = formData.get("title") as string;
            const priority = (formData.get("priority") as string) || "MEDIUM";
            const isPinned = formData.get("isPinned") === "on";

            const payload = {
                title,
                description,
                priority,
                isPinned,
                targetCourses: selectedCourses,
            };

            const response = await fetch('/api/class-notice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorText = result.error || 'Failed to publish notice';
                setErrorMessage(errorText);
                throw new Error(errorText);
            }

            setStatus('success');

            // Clean up form
            setDescription("");
            setUploadedFiles([]);
            setSelectedCourses([]);
            formElement.reset();

            if (onSuccess) {
                setTimeout(onSuccess, 1000);
            } else {
                setTimeout(() => setStatus('idle'), 5000);
            }

        } catch (error: any) {
            console.error("Notice submission failed:", error);
            setStatus('error');
            if (!errorMessage) setErrorMessage(error.message || "An unexpected error occurred.");
            setTimeout(() => setStatus('idle'), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section: Notice Content */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Title</label>
                    <input
                        name="title"
                        required
                        type="text"
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
                                modules={editorModules}
                                className="h-full flex flex-col [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-20 [&_.ql-toolbar]:bg-gray-50 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-editor]:min-h-[200px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Configuration & Targeting */}
            <div className="lg:col-span-1 space-y-6">

                {/* Targeting */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Courses</label>
                        <button
                            type="button"
                            onClick={handleToggleAllCourses}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            {selectedCourses.length === courses.length ? "Deselect All" : "Select All"}
                        </button>
                    </div>

                    {fetchingCourses ? (
                        <div className="text-sm text-slate-400 py-2">Loading courses...</div>
                    ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                            {courses.length === 0 ? (
                                <div className="text-sm text-amber-500 py-2 text-center border-2 border-dashed border-amber-100 rounded-xl">No courses assigned.</div>
                            ) : (
                                courses.map(course => (
                                    <label key={course.id} className={`
                                        flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all text-sm
                                        ${selectedCourses.includes(course.id)
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                                    `}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.includes(course.id)}
                                            onChange={() => toggleCourseSelection(course.id)}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${selectedCourses.includes(course.id) ? 'bg-white border-white' : 'border-slate-300'}`}>
                                            {selectedCourses.includes(course.id) && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />}
                                        </div>
                                        <span className="truncate font-medium">{course.courseCode || course.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    )}
                    <div className="text-xs text-slate-400 mt-3 font-medium text-right">
                        {selectedCourses.length} courses selected
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Settings</label>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors">
                            <input type="checkbox" name="isPinned" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                            <span className="text-sm font-medium text-slate-700 flex-1">Pin to Top</span>
                            <Pin className="w-4 h-4 text-slate-400" />
                        </label>

                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <label className="text-sm font-medium text-slate-700 flex-1">Priority</label>
                            <select name="priority" className="text-sm bg-transparent font-bold text-slate-600 outline-none cursor-pointer">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button type="button" onClick={handleFileSelect} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                            <UploadCloud className="w-3 h-3" /> Add File
                        </button>
                    </div>

                    <div className="space-y-3">
                        {uploadedFiles.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                <span className="text-xs text-slate-400">No files attached</span>
                            </div>
                        ) : (
                            uploadedFiles.map((file, index) => (
                                <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {file.isPrivate ? <FolderLock className="w-4 h-4 text-rose-500 shrink-0" /> : <FolderOpen className="w-4 h-4 text-emerald-500 shrink-0" />}
                                            <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                                        </div>
                                        <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-rose-500 p-1">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-lg">
                                        <span className="text-slate-500 font-medium">Access Level:</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleFilePrivacy(index)}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-colors ${file.isPrivate ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}
                                        >
                                            {file.isPrivate ? "Private" : "Public"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Submission */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || selectedCourses.length === 0}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                        {loading ? "Publishing..." : "Publish Notice"}
                    </button>

                    {(status === 'success' || status === 'error') && (
                        <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2
                                 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {status === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {status === 'success' ? `Successfully published to ${selectedCourses.length} courses!` : errorMessage || "Failed to publish notice."}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
