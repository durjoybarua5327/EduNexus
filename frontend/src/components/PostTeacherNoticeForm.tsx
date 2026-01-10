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

export default function PostTeacherNoticeForm({ onSuccess }: PostTeacherNoticeFormProps = {}) {
    const [courses, setCourses] = useState<any[]>([]);
    const [fetchingCourses, setFetchingCourses] = useState(true);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadedFiles, setUploadedFiles] = useState<{ file?: File; name: string; isPrivate: boolean }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await fetchAPI('/teacher/courses');
                if (Array.isArray(data)) {
                    setCourses(data);
                }
            } catch (e) {
                console.error("Failed to load courses", e);
            } finally {
                setFetchingCourses(false);
            }
        };
        loadCourses();
    }, []);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setUploadedFiles(prev => [...prev, { file, name: file.name, isPrivate: false }]);
        }
        // Reset input so the same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

    const toggleFilePrivacy = (index: number) => {
        setUploadedFiles(prev => prev.map((f, i) => i === index ? { ...f, isPrivate: !f.isPrivate } : f));
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCourse = (id: string) => {
        setSelectedCourses(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedCourses.length === courses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses(courses.map(c => c.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget; // Capture form reference immediately
        setLoading(true);
        setStatus('idle');

        try {
            const formData = new FormData(form);
            const title = formData.get("title") as string;
            const priority = (formData.get("priority") as string) || "MEDIUM";
            const isPinned = formData.get("isPinned") === "on";

            // Prepare the request body
            const requestBody = {
                title,
                description,
                priority,
                isPinned,
                targetCourses: selectedCourses,
                // Note: File attachments will need separate handling via file upload API
                // For now, we're just posting the notice without file attachments
            };

            console.log("Submitting notice:", requestBody);

            // Make the actual API call
            const response = await fetch('/api/class-notice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to publish notice');
            }

            console.log("Notice published successfully:", result);
            setStatus('success');

            // Reset form
            setDescription("");
            setUploadedFiles([]);
            setSelectedCourses([]);
            form.reset(); // Use captured reference

            // Call onSuccess callback if provided
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1000); // Small delay to show success message
            } else {
                // Auto-hide success message after 5 seconds only if no callback
                setTimeout(() => setStatus('idle'), 5000);
            }

        } catch (error) {
            console.error("Error publishing notice:", error);
            setStatus('error');
            // Auto-hide error message after 5 seconds
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
                        placeholder="e.g. Mid-Term Exam Syllabus"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg font-medium placeholder:text-slate-300"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Notice Details (Rich Text)</label>
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

            {/* Right Column: Settings & Files */}
            <div className="lg:col-span-1 space-y-6">
                {/* Course Selector */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Courses</label>
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            {selectedCourses.length === courses.length ? "Deselect All" : "Select All"}
                        </button>
                    </div>

                    {fetchingCourses ? (
                        <div className="text-sm text-slate-400 py-2">Loading courses...</div>
                    ) : courses.length === 0 ? (
                        <div className="text-sm text-amber-500 py-2">No courses assigned.</div>
                    ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                            {courses.map(course => (
                                <label key={course.id} className={`
                                        flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all text-sm
                                        ${selectedCourses.includes(course.id)
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                                    `}>
                                    <input
                                        type="checkbox"
                                        value={course.id}
                                        checked={selectedCourses.includes(course.id)}
                                        onChange={() => toggleCourse(course.id)}
                                        className={`w-4 h-4 rounded focus:ring-offset-0 ${selectedCourses.includes(course.id) ? 'accent-white' : 'accent-indigo-600'}`}
                                    />
                                    <span className="truncate font-medium">{course.courseCode || course.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    <div className="text-xs text-slate-400 mt-3 font-medium text-right">
                        {selectedCourses.length} selected
                    </div>
                </div>

                {/* Configurations */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Settings</label>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <input type="checkbox" name="isPinned" id="isPinned" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                        <label htmlFor="isPinned" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">Pin to Top</label>
                        <Pin className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <label htmlFor="priority" className="text-sm font-medium text-slate-700 flex-1">Priority</label>
                        <select name="priority" className="text-sm bg-transparent font-bold text-slate-600 outline-none cursor-pointer">
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attachments</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button type="button" onClick={handleFileSelect} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                            <UploadCloud className="w-3 h-3" /> Add File
                        </button>
                    </div>

                    <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
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
                        ))}
                        {uploadedFiles.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                <span className="text-xs text-slate-400">No files attached</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
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
                            {status === 'success' ? `Published to ${selectedCourses.length} courses!` : "Failed to publish."}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
