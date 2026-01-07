
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl shadow-indigo-200">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.name?.split(' ')[0]}!</h1>
                    <p className="text-indigo-100/90 text-lg">Here's an overview of your academic progress for {semesterName}.</p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className={`p-6 bg-white rounded-2xl border ${stat.color.split(' ').pop()} shadow-sm hover:shadow-md transition-all duration-300 group`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3.5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Courses List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Enrolled Courses
                        </h2>
                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            {courses.length} Courses
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {courses.length > 0 ? (
                            courses.map((course: any) => (
                                <div key={course.id} className="group p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {course.code}
                                        </span>
                                        <span className="text-xs font-medium text-gray-400">3.0 Cr</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">{course.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {course.teacherName ? course.teacherName[0] : "T"}
                                        </div>
                                        <span>{course.teacherName || "TBA"}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No courses enrolled yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Panel: Notices Preview (Mock/Limited) */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 h-fit shadow-lg shadow-gray-100/50">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        Upcoming Events
                    </h2>
                    <div className="space-y-6">
                        {/* Placeholder Events */}
                        <div className="relative pl-6 border-l-2 border-indigo-100 pb-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-500"></div>
                            <p className="text-xs font-bold text-indigo-600 mb-1">Tomorrow, 10:00 AM</p>
                            <h4 className="text-sm font-semibold text-gray-900">CSE 101 Quiz</h4>
                            <p className="text-xs text-gray-500 mt-1">Room 302</p>
                        </div>
                        <div className="relative pl-6 border-l-2 border-gray-100 pb-2">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-gray-300"></div>
                            <p className="text-xs font-bold text-gray-500 mb-1">15th March</p>
                            <h4 className="text-sm font-semibold text-gray-700">Project Submission</h4>
                            <p className="text-xs text-gray-500 mt-1">Online Upload</p>
                        </div>
                    </div>
                    <button className="w-full mt-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                        View Calendar
                    </button>
                </div>
            </div>
        </div>
    );
}
