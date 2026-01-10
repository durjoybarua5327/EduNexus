"use client";

import { FolderBrowser } from "@/components/FolderBrowser";
import { BookOpen, GraduationCap, HardDrive } from "lucide-react";
import { ProfileEditButton } from "@/components/ProfileEditButton";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";

interface ProfileViewProps {
    profile: any;
    currentUser: any;
    cloudData: {
        folders: any[];
        files: any[];
        breadcrumbs: any[];
        folderId: string | null;
    };
    basePath: string;
    headerActions?: React.ReactNode;
}

function Badge({ children, color }: { children: React.ReactNode, color: string }) {
    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${color} transition-transform hover:scale-105 cursor-default`}>
            {children}
        </span>
    );
}

export function ProfileView({ profile, currentUser, cloudData, basePath, headerActions }: ProfileViewProps) {
    const isOwnProfile = currentUser?.id === profile?.userId || currentUser?.id === profile?.id; // Handle specialized profile obj vs user obj

    // Normalize profile data for display
    const displayUser = {
        name: profile.name,
        email: profile.email,
        image: profile.image,
        role: profile.role
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header / Hero Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-white/60 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 border border-white/50 shadow-2xl shadow-indigo-100/40 flex flex-col md:flex-row items-center gap-6 overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50"></div>

                    {/* Header Actions (e.g. Back Button) */}
                    {headerActions && (
                        <div className="absolute top-6 left-6 md:left-8 z-20">
                            {headerActions}
                        </div>
                    )}

                    {/* Avatar with Upload */}
                    <div className={headerActions ? "mt-12 md:mt-0" : ""}>
                        <ProfileImageUploader
                            key={profile.id}
                            currentImage={displayUser.image}
                            userName={displayUser.name}
                            userId={currentUser.id}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left space-y-3 relative z-10">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                                {displayUser.name}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">{displayUser.email}</p>

                            {/* Show subjects taught for teachers */}
                            {displayUser.role === 'TEACHER' && profile.courses && profile.courses.length > 0 && (
                                <p className="text-xs text-purple-600 font-semibold mt-2 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    Teaches: {profile.courses.map((c: any) => c.courseName || c.name).join(', ')}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mt-3">
                            {/* Role Badge - Show for all users */}
                            <Badge color={
                                profile.isTopCR && displayUser.role === 'CR' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200' :
                                    displayUser.role === 'SUPER_ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        displayUser.role === 'DEPT_ADMIN' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            displayUser.role === 'TEACHER' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                displayUser.role === 'CR' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                            }>
                                <GraduationCap className="w-3 h-3 mr-1 inline" />
                                {profile.isTopCR && displayUser.role === 'CR' ? '👑 Top CR' :
                                    displayUser.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                        displayUser.role === 'DEPT_ADMIN' ? 'Department Admin' :
                                            displayUser.role === 'TEACHER' ? 'Professor' :
                                                displayUser.role === 'CR' ? 'Class Representative' :
                                                    'Student'}
                            </Badge>

                            {/* Show teacher designation for TEACHER role */}
                            {displayUser.role === 'TEACHER' && (
                                <>
                                    {profile.designation && (
                                        <Badge color="bg-purple-50 text-purple-700 border-purple-100">
                                            {profile.designation}
                                        </Badge>
                                    )}
                                    <Badge color="bg-blue-50 text-blue-700 border-blue-100">
                                        {profile.departmentId ? "CSE Department" : "Faculty"}
                                    </Badge>
                                </>
                            )}

                            {/* Show student-specific badges for STUDENT/CR roles */}
                            {(displayUser.role === 'STUDENT' || displayUser.role === 'CR') && (
                                <>
                                    <Badge color="bg-indigo-50 text-indigo-700 border-indigo-100">
                                        {profile.departmentId ? "CSE" : "Dept N/A"}
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
                                </>
                            )}

                            <div className="md:ml-auto">
                                <ProfileEditButton currentName={displayUser.name} isOwnProfile={isOwnProfile} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher Courses Section */}
            {displayUser.role === 'TEACHER' && profile.courses && profile.courses.length > 0 && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Teaching Courses</h2>
                            <p className="text-xs text-slate-500 font-medium">Subjects taught by {displayUser.name}</p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-xl shadow-purple-100/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {profile.courses.map((course: any) => (
                                <div key={course.id} className="group relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-purple-700 transition">
                                                {course.courseName || course.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-medium mb-2">
                                                {course.courseCode || 'N/A'}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {course.semester && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                        {course.semester.name || `Sem ${course.semester.semesterNumber}`}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                                    {course.credits || 3} Credits
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Cloud Section - Only show for STUDENT and CR profiles */}
            {(displayUser.role === 'STUDENT' || displayUser.role === 'CR') && (
                <div className="pt-2">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <HardDrive className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                                {isOwnProfile ? "Personal Cloud" : `${displayUser.name}'s Public Files`}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {isOwnProfile
                                    ? "Secure storage for your assignments and resources."
                                    : "Browse public files shared by this user."}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-xl shadow-indigo-100/20 min-h-[600px]">
                        <FolderBrowser
                            folders={cloudData.folders || []}
                            files={cloudData.files || []}
                            breadcrumbs={cloudData.breadcrumbs}
                            currentFolderId={cloudData.folderId}
                            basePath={basePath}
                            allowUploads={isOwnProfile}
                            showPrivacy={isOwnProfile}
                            isViewingOthers={!isOwnProfile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
