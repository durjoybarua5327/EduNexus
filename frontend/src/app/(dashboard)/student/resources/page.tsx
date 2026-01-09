
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
        <div className="max-w-[1600px] mx-auto space-y-12 p-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-100">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Resources
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        Browse and manage academic materials by semester.
                    </p>
                </div>
            </div>

            {/* Semester Folders Reuse */}
            <div className="grid gap-8">
                <div>
                    <SemesterFolders
                        semesters={semestersList}
                        currentSemester={profile.semesterName || "1st"} // Default or current
                        departmentId={profile.departmentId}
                        basePath="/student/resources" // Redirect to this page with params
                        isResourceView={true} // New prop to indicate this is for file browsing
                        canManage={canManage} // New prop for CR permissions
                    />
                </div>
            </div>

        </div >
    );
}

import { SemesterFolders } from "../semester/SemesterFolders";
