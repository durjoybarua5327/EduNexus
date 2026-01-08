import { auth } from "@/auth";
import { getStudentProfile, getStudentCourses } from "@/lib/api";
import { FolderBrowser } from "@/components/FolderBrowser";
import { getFolderContents } from "@/lib/actions/files";
import {
    FileText, Folder, HardDrive, LayoutDashboard, User,
    GraduationCap, BookOpen, Clock, Calendar, Sparkles,
    TrendingUp, Award
} from "lucide-react";
import Image from "next/image";
import { ProfileEditButton } from "@/components/ProfileEditButton";

export default async function ProfilePage(props: { searchParams: Promise<{ folderId?: string; userId?: string; user?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500 font-semibold">Please log in to view your profile.</div>;

    const queryUserId = searchParams?.userId || searchParams?.user; // Handle both just in case, though we use userId
    // If viewing another user, fetch THEIR profile.
    const profile = await getStudentProfile(queryUserId || undefined);

    // If fetch failed or user not found
    if (!profile) {
        return <div className="p-8 text-center text-slate-500 font-semibold">Student profile not found.</div>;
    }

    // Determine if we are viewing our own profile
    const isOwnProfile = !queryUserId || queryUserId === user.id;

    // Use profile data for display (it contains name, email, image etc from the API now)
    const displayUser = {
        name: profile.name,
        email: profile.email,
        image: profile.image,
        role: profile.role
    };

    // Fetch Courses for Stats (using profile's department and semester)
    const courses = await getStudentCourses(profile?.departmentId || '', profile?.semesterId || '');

    // Stats Data with Enhanced Visuals
    const stats = [
        {
            label: "Current Semester",
            value: profile?.semesterName || "N/A",
            icon: GraduationCap,
            bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
            text: "text-blue-50",
            border: "border-blue-200"
        },
        {
            label: "Enrolled Courses",
            value: courses.length || 0,
            icon: BookOpen,
            bg: "bg-gradient-to-br from-violet-500 to-purple-600",
            text: "text-purple-50",
            border: "border-purple-200"
        },
        {
            label: "Attendance",
            value: "92%",
            icon: Clock,
            bg: "bg-gradient-to-br from-emerald-400 to-teal-600",
            text: "text-green-50",
            border: "border-green-200"
        },
        {
            label: "CGPA",
            value: "3.85",
            icon: Award,
            bg: "bg-gradient-to-br from-amber-400 to-orange-600",
            text: "text-orange-50",
            border: "border-orange-200"
        },
    ];

    // Fetch User's Cloud Files
    const folderId = searchParams?.folderId || null;
    const { folders, files } = await getFolderContents(folderId, user.id);

    const breadcrumbs = folderId ? [{ id: folderId, name: "Current Folder" }] : [];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 md:p-12 border border-white/50 shadow-2xl shadow-indigo-100/40 flex flex-col md:flex-row items-center gap-10 overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50"></div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-40 h-40 rounded-full p-1.5 bg-gradient-to-br from-indigo-200 to-purple-200 shadow-xl">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-white relative">
                                {displayUser.image ? (
                                    <img src={displayUser.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <User className="w-20 h-20 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2 p-2.5 bg-gray-900 text-white rounded-full border-4 border-white shadow-lg">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-2">
                                {displayUser.name}
                            </h1>
                            <p className="text-lg text-slate-500 font-medium">{displayUser.email}</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            <Badge color="bg-indigo-50 text-indigo-700 border-indigo-100">
                                {profile?.departmentId ? "Computer Science" : "Department N/A"}
                            </Badge>
                            <Badge color="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100">
                                Batch: {profile?.batchName || "N/A"}
                            </Badge>
                            <Badge color="bg-cyan-50 text-cyan-700 border-cyan-100">
                                ID: {profile?.studentIdNo || "N/A"}
                            </Badge>
                            {!isOwnProfile && (
                                <Badge color="bg-slate-100 text-slate-600 border-slate-200">
                                    View Only
                                </Badge>
                            )}

                            <div className="md:ml-auto">
                                <ProfileEditButton currentName={displayUser.name} isOwnProfile={isOwnProfile} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Access or decorative */}
                    <div className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-4"></div>

                    <div className="hidden lg:flex flex-col gap-4 min-w-[200px]">
                        <div className="p-4 rounded-2xl bg-white/50 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-default">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full text-sm font-bold">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Active Student
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="group relative">
                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.bg} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500`}></div>
                        <div className="relative p-6 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3.5 rounded-2xl shadow-inner ${stat.bg} text-white`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white border shadow-sm text-slate-600`}>
                                    +2.5%
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Personal Cloud Section - Only visible to owner */}
            {isOwnProfile && (
                <div className="pt-4">
                    <div className="flex items-center gap-4 mb-6 px-2">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <HardDrive className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Personal Cloud</h2>
                            <p className="text-slate-500 font-medium">Secure storage for your assignments and resources.</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-xl shadow-indigo-100/20">
                        <FolderBrowser
                            folders={folders || []}
                            files={files || []}
                            breadcrumbs={breadcrumbs}
                            currentFolderId={folderId}
                            basePath="/student/profile"
                            allowUploads={true}
                            showPrivacy={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function Badge({ children, color }: { children: React.ReactNode, color: string }) {
    return (
        <span className={`px-4 py-1.5 text-sm font-bold rounded-full border shadow-sm ${color} transition-transform hover:scale-105 cursor-default`}>
            {children}
        </span>
    );
}
