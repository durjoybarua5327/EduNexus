
import { auth } from "@/auth";
import { getStudentProfile, getStudentCourses, getCourseById } from "@/lib/api";
import { getFolderContents } from "@/lib/actions/files";
import { FolderBrowser } from "@/components/FolderBrowser";
import { BookOpen, Folder, LayoutDashboard, Sparkles, Zap, ArrowRight } from "lucide-react";
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
        // Fetch course details and folder contents
        const [courseDetails, { folders, files }] = await Promise.all([
            getCourseById(courseId),
            getFolderContents(folderId, undefined, courseId)
        ]);
        const basePath = `/student/resources?courseId=${courseId}`;

        const courseDisplayName = courseDetails
            ? `${courseDetails.code} - ${courseDetails.name}`
            : courseId;

        return (
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">

                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Course Materials
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Viewing resources for <span className="text-slate-900 font-bold">{courseDisplayName}</span></p>
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
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Premium Header */}
            <div className="relative mb-8">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute top-0 right-10 w-24 h-24 bg-violet-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Resources</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg max-w-lg">
                            Browse by semester. Currently in <span className="font-bold text-indigo-600">{profile?.semesterName || "N/A"}</span> semester.
                        </p>
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
