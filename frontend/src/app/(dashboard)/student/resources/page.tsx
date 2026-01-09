
import { auth } from "@/auth";
import { getStudentProfile, getStudentCourses } from "@/lib/api";
import { getFolderContents } from "@/lib/actions/files";
import { FolderBrowser } from "@/components/FolderBrowser";
import { BookOpen, Folder, LayoutDashboard, Sparkles, Zap, ArrowRight, Library } from "lucide-react";
import Link from "next/link";
import * as Motion from "framer-motion/client"; // Use client proxy for server components if needed, or just plain divs with classes for server components. Actually, for animations in RSC, we often need a client wrapper.
// Since this is a Server Component, I'll use standard CSS animations or a client wrapper for the grid.
// For simplicity and speed in RSC, let's use a Client Wrapper for the list to allow animation.

import { ResourcesGrid } from "@/components/ResourcesGrid"; // I'll create this

export default async function ResourcesPage({
    searchParams,
}: {
    searchParams: Promise<{ folderId?: string, courseId?: string }>;
}) {
    const session = await auth();
    const user = session?.user;
    if (!user) return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;

    const params = await searchParams;
    const folderId = params?.folderId || null;
    const courseId = params?.courseId || null;

    // View: Specific functionality (Course Folder Browser)
    if (courseId) {
        // Fetch Folders for this Course (and Parent if navigated)
        const { folders, files } = await getFolderContents(folderId, undefined, courseId);
        const basePath = `/student/resources?courseId=${courseId}`;

        return (
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">

                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Course Materials
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Viewing resources for <span className="text-slate-900 font-bold">{courseId}</span></p>
                    </div>
                    <Link href="/student/resources" className="group px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold shadow-sm flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Back to Subjects
                    </Link>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-white/60 shadow-xl shadow-slate-200/50">
                    <FolderBrowser
                        folders={folders || []}
                        files={files || []}
                        breadcrumbs={folderId ? [{ id: folderId, name: 'Current Folder' }] : []}
                        currentFolderId={folderId}
                        basePath={basePath}
                        allowUploads={false}
                    />
                </div>
            </div>
        );
    }

    // View: List of Subjects (Courses)
    const profile = await getStudentProfile();

    if (!profile || !profile.departmentId || !profile.semesterId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-6 bg-amber-50 rounded-full border-4 border-amber-100 shadow-xl">
                    <LayoutDashboard className="w-16 h-16 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Setup Pending</h1>
                    <p className="text-lg text-slate-500 max-w-md mx-auto font-medium">
                        You have not been assigned to a Department or Semester yet.
                    </p>
                </div>
            </div>
        );
    }

    const courses = await getStudentCourses(profile.departmentId, profile.semesterId);

    // View: List of Semesters (Default View)
    const semestersList = [
        "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"
    ];

    // Check if user is CR or Admin to allow uploads and privacy settings
    const canManage = user?.role === 'CR' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Premium Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 rounded-[2.5rem] blur-xl opacity-60 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 border border-white/60 shadow-2xl shadow-amber-100/30 overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-gradient-to-tr from-rose-50 to-pink-50 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-200/50">
                                    <Library className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                    Resources
                                </h1>
                            </div>
                            <p className="text-slate-500 font-medium text-lg max-w-lg">
                                Browse and manage academic materials. Select a semester to explore course resources.
                            </p>
                        </div>

                        {/* Stats Badges */}
                        <div className="flex flex-wrap gap-3">
                            <div className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-lg">
                                <div className="text-2xl font-black text-amber-600">{semestersList.length}</div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semesters</div>
                            </div>
                            <div className="px-5 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-lg">
                                <div className="text-2xl font-black text-rose-600">{profile?.semesterName || "N/A"}</div>
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Semester Folders Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-200/50">
                        <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Browse by Semester</h2>
                        <p className="text-xs text-slate-500 font-medium">Click on a semester folder to view available subjects</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-xl shadow-indigo-100/20">
                    <SemesterFolders
                        semesters={semestersList}
                        currentSemester={profile.semesterName || "1st"}
                        departmentId={profile.departmentId}
                        basePath="/student/resources"
                        isResourceView={true}
                        canManage={canManage}
                    />
                </div>
            </div>

        </div>
    );
}

import { SemesterFolders } from "../semester/SemesterFolders";
