
import { auth } from "@/auth";
import { getStudentProfile } from "@/lib/api";
import { fetchAPI } from "@/lib/api";
import { BookOpen, Calendar, Clock, GraduationCap, LayoutDashboard } from "lucide-react";

async function getStudentCourses(departmentId: string, semesterId: string) {
    if (!departmentId || !semesterId) return [];
    return await fetchAPI(`/dept/courses?departmentId=${departmentId}&semesterId=${semesterId}`) || [];
}

export default async function SemesterPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500">Please log in to view this page.</div>;

    // Fetch Student Context
    const profile = await getStudentProfile();

    // Handle case where profile hasn't been set up fully (e.g. new user not assigned to batch)
    if (!profile || !profile.departmentId || !profile.semesterId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="p-4 bg-yellow-50 rounded-full">
                    <LayoutDashboard className="w-12 h-12 text-yellow-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Setup Pending</h1>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        You have not been assigned to a Batch or Semester yet. Please contact your Department Administrator.
                    </p>
                </div>
                {/* Debug info if needed */}
                <div className="text-xs text-gray-400 mt-8">
                    Dept: {profile?.departmentId || 'N/A'} | Batch: {profile?.batchName || 'N/A'}
                </div>
            </div>
        );
    }

    const { departmentId, semesterId, semesterName } = profile;
    const courses = await getStudentCourses(departmentId, semesterId);

    // Mock stats for now (Attendance/CGPA require complex Gradebook system)
    const stats = [
        { label: "Current Semester", value: semesterName || "N/A", icon: GraduationCap, color: "text-blue-600 bg-blue-50 border-blue-100" },
        { label: "Enrolled Courses", value: courses.length || 0, icon: BookOpen, color: "text-purple-600 bg-purple-50 border-purple-100" },
        { label: "Attendance", value: "92%", icon: Clock, color: "text-green-600 bg-green-50 border-green-100" },
        { label: "CGPA", value: "3.85", icon: Calendar, color: "text-orange-600 bg-orange-50 border-orange-100" },
    ];

    const semestersList = [
        "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-6">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-indigo-200">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Academic Roadmap</h1>
                    <p className="text-indigo-100/90 text-lg">
                        You are currently in the <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded">{semesterName} Semester</span>
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
            </div>

            <div className="grid gap-8">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <Folders className="w-5 h-5 text-indigo-600" />
                        Semester Archives
                    </h2>

                    <SemesterFolders
                        semesters={semestersList}
                        currentSemester={semesterName!}
                        departmentId={departmentId}
                    />
                </div>
            </div>
        </div>
    );
}

import { Folder as Folders } from "lucide-react";
import { SemesterFolders } from "./SemesterFolders";
