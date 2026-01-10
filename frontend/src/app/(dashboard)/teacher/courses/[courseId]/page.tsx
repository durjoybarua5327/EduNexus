"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Users, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { FolderBrowser } from "@/components/FolderBrowser";
import { useUser } from "@/context/user-context";
import { useSearchParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";

export default function CourseManagePage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const { courseId } = params;
    const { user } = useUser();
    const searchParams = useSearchParams();
    const folderId = searchParams.get("folderId") || null;

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<{ folders: any[]; files: any[]; breadcrumbs: any[] }>({
        folders: [],
        files: [],
        breadcrumbs: []
    });

    // Real Students State
    const [students, setStudents] = useState<any[]>([]);
    const [isStudentListExpanded, setIsStudentListExpanded] = useState(false);

    const fetchCourseData = async () => {
        try {
            const res = await fetch(`/api/course/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch(`/api/course/${courseId}/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (e) {
            console.error("Failed to load students", e);
        }
    }

    const fetchResources = async () => {
        if (!user?.id) return;
        try {
            // Fetch files specifically for this course
            const url = folderId
                ? `/files?ownerId=${user.id}&parentId=${folderId}`
                : `/files?ownerId=${user.id}&courseId=${courseId}`; // Special filter for course root

            const res = await fetchAPI(url);
            if (res) {
                // AUTO-NAVIGATE: If we are at root and see only the Course Wrapper folder, dive in.
                // This satisfies "show inside the Courses file and folder"
                if (!folderId && res.folders.length === 1 && res.files.length === 0 && res.folders[0].isSystem) {
                    const courseFolderId = res.folders[0].id;
                    // We can't easily modify URL without triggering reload in some setups, but Next.js router is fine.
                    // However, to keep it simple and fast, let's just fetch the CONTENT of that folder immediately
                    // and present THAT as the view, effectively skipping the wrapper.
                    // BUT: We need to update the URL so breadcrumbs work. 
                    // Let's rely on the user clicking for now OR force a redirect?
                    // Redirect is safer for consistency.
                    // Actually, let's fetch the inner content and set THAT as resources, simulating we are inside.
                    // Problem: Breadcrumbs will be missing the root.
                    // Better: Just update the URL.
                    const newUrl = `/teacher/courses/${courseId}?folderId=${courseFolderId}`;
                    window.history.replaceState(null, '', newUrl); // Soft navigation
                    // Now fetch inner
                    const innerRes = await fetchAPI(`/files?ownerId=${user.id}&parentId=${courseFolderId}`);
                    if (innerRes) setResources(innerRes);
                } else {
                    setResources(res);
                }
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        // Initial load
        setLoading(true);
        Promise.all([fetchCourseData(), fetchResources(), fetchStudents()]).finally(() => setLoading(false));
    }, [courseId, user?.id]); // Run once on mount/user avail

    // Separate effect for folder navigation to avoid full page flicker if possible, 
    // or just include folderId in the main dependency array (simplest)
    useEffect(() => {
        if (!loading) fetchResources();
    }, [folderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header / Hero */}
            <div className="relative bg-slate-900 text-white overflow-hidden pb-32 pt-12 px-6 md:px-12 rounded-b-[3rem] shadow-2xl">
                {/* Abstract Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-[1600px] mx-auto">
                    {/* Breadcrumb / Back */}
                    <div className="mb-8">
                        <Link href="/teacher/courses" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-semibold">Back to Courses</span>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-indigo-300 font-bold uppercase tracking-wider text-sm">
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                                    {course?.code || "No Code"}
                                </span>
                                <span>•</span>
                                <span>{course?.semesterName || "Semester N/A"}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                                {course?.name || "Course Dashboard"}
                            </h1>
                            <div className="flex items-center gap-6 text-slate-300 font-medium pt-2">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-400" />
                                    <span>{course?.credits ? `${course.credits} Credits` : "Credits N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-fuchsia-400" />
                                    <span>{course?.studentCount || 0} Students Enrolled</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Widget */}
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[140px]">
                                <div className="text-3xl font-bold text-white mb-1">{course?.studentCount || 0}</div>
                                <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Students</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Content Layout */}
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 -mt-20 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Resources (70%) */}
                    <div className="w-full lg:w-[70%] space-y-8">
                        {/* Section Header */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]">
                            {/* Passed folder data */}
                            <FolderBrowser
                                folders={resources.folders}
                                files={resources.files}
                                breadcrumbs={resources.breadcrumbs}
                                currentFolderId={folderId}
                                basePath={`/teacher/courses/${courseId}`}
                                allowUploads={false}
                                onRefresh={fetchResources}
                            />
                        </div>
                    </div>

                    {/* Right Column: Students & Actions (30%) */}
                    <div className="w-full lg:w-[30%] space-y-6">

                        {/* Students Widget */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    Students
                                </h3>
                                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                    {students.length} Total
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <Link
                                            key={student.id}
                                            href={`/teacher/courses/${courseId}/students/${student.id}`}
                                            className="block"
                                        >
                                            <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                                {/* Avatar or Initials */}
                                                {student.image ? (
                                                    <img src={student.image} alt={student.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate">{student.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{student.studentIdNo || "N/A"}</span>
                                                        <span>{student.batchName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <p className="text-sm">No students enrolled.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => setIsStudentListExpanded(true)}
                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                                >
                                    View Full Class List
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Full Screen Student List Modal */}
            {isStudentListExpanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setIsStudentListExpanded(false)}
                >
                    <div
                        className="bg-white rounded-[2.5rem] w-full max-w-[95vw] h-[95vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 z-10">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                    <Users className="w-8 h-8 text-indigo-600" />
                                    Full Class List
                                </h2>
                                <p className="text-slate-600 font-medium mt-2">
                                    {course?.name || "Course"} • {course?.code || ""} • Total {students.length} students enrolled
                                </p>
                            </div>
                            <button
                                onClick={() => setIsStudentListExpanded(false)}
                                className="p-3 rounded-full hover:bg-white text-slate-400 hover:text-slate-600 transition-all hover:shadow-md"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable Grid */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {students.map((student) => (
                                    <Link
                                        key={student.id}
                                        href={`/teacher/courses/${courseId}/students/${student.id}`}
                                        className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        {/* Larger Avatar */}
                                        {student.image ? (
                                            <img
                                                src={student.image}
                                                alt={student.name}
                                                className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-slate-100 group-hover:ring-indigo-100 transition-all"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-md ring-4 ring-slate-100 group-hover:ring-indigo-100 transition-all">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="flex-1 w-full text-center space-y-2">
                                            <div className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                {student.name}
                                            </div>
                                            <div className="text-sm text-slate-500 truncate px-2">
                                                {student.email}
                                            </div>
                                            <div className="flex flex-col gap-2 items-center pt-2">
                                                <span className="font-mono bg-slate-100 px-3 py-1.5 rounded-lg font-semibold text-slate-700 text-sm w-fit">
                                                    ID: {student.studentIdNo || "N/A"}
                                                </span>
                                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold text-sm w-fit">
                                                    {student.batchName}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {students.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <Users className="w-20 h-20 mx-auto mb-4 text-slate-200" />
                                    <p className="text-xl font-medium">No students enrolled in this course yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
