import { auth } from "@/auth";
import { getStudentProfile } from "@/lib/api";
import { FolderBrowser } from "@/components/FolderBrowser";
import { getFolderContents } from "@/lib/actions/files";
import {
    LayoutDashboard, User, Sparkles, HardDrive
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



    // Fetch User's Cloud Files
    const folderId = searchParams?.folderId || null;
    const { folders, files, breadcrumbs } = await getFolderContents(folderId, user.id);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white/60 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 border border-white/50 shadow-2xl shadow-indigo-100/40 flex flex-col md:flex-row items-center gap-6 overflow-hidden">

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
                    <div className="flex-1 text-center md:text-left space-y-3 relative z-10">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                                {displayUser.name}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">{displayUser.email}</p>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mt-3">
                            <Badge color="bg-indigo-50 text-indigo-700 border-indigo-100">
                                {profile?.departmentId ? "CSE" : "Dept N/A"}
                            </Badge>
                            <Badge color="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100">
                                Batch: {profile?.batchName || "N/A"}
                            </Badge>
                            <Badge color="bg-cyan-50 text-cyan-700 border-cyan-100">
                                ID: {profile?.studentIdNo || "N/A"}
                            </Badge>
                            <Badge color="bg-emerald-50 text-emerald-700 border-emerald-100">
                                Semester: {profile?.semesterName || "N/A"}
                            </Badge>

                            <div className="md:ml-auto">
                                <ProfileEditButton currentName={displayUser.name} isOwnProfile={isOwnProfile} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Personal Cloud Section - Only visible to owner */}
            {isOwnProfile && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <HardDrive className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Personal Cloud</h2>
                            <p className="text-xs text-slate-500 font-medium">Secure storage for your assignments and resources.</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-xl shadow-indigo-100/20">
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
        <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${color} transition-transform hover:scale-105 cursor-default`}>
            {children}
        </span>
    );
}
