
import { auth } from "@/auth";
import { getStudentProfile } from "@/lib/api";
import { getFolderContents } from "@/lib/actions/files";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";

export default async function StudentProfileViewPage(props: { params: Promise<{ courseId: string; studentId: string }>; searchParams: Promise<{ folderId?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { courseId, studentId } = params;
    const session = await auth();

    if (!session?.user) return redirect("/login");

    // Fetch Student Profile
    const profile = await getStudentProfile(studentId);

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Student Not Found</h2>
                    <p className="text-slate-500 mb-6">The requested student profile could not be found.</p>
                    <Link href={`/teacher/courses/${courseId}`} className="text-indigo-600 font-bold hover:underline">
                        Return to Course
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch Student Public Files
    const folderId = searchParams?.folderId || null;
    // We pass studentId as the owner to fetch THEIR files
    const { folders, files, breadcrumbs } = await getFolderContents(folderId, studentId);

    return (
        <div className="p-6 md:p-8">
            <ProfileView
                profile={profile}
                currentUser={session.user}
                cloudData={{ folders, files, breadcrumbs, folderId }}
                basePath={`/teacher/courses/${courseId}/students/${studentId}`}
                headerActions={
                    <Link href={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors bg-white/50 hover:bg-white/80 px-4 py-2.5 rounded-full backdrop-blur-sm border border-indigo-100 shadow-sm font-semibold text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Course
                    </Link>
                }
            />
        </div>
    );
}
