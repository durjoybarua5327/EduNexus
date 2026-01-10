"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, Users, ArrowRight, GraduationCap, Loader2, Sparkles, Layout } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";

// Actual implementation
export default function TeacherCoursesPage() {
    const { user } = useUser();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const res = await fetch('/api/teacher/courses');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchCourses();
    }, []);

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight flex items-center gap-3">
                            <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-indigo-200" />
                            Academic Panel
                        </h1>
                        <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-xl">
                            Welcome back, Professor. Overview of your assigned courses and academic schedule.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center">
                            <div className="text-3xl font-bold">{loading ? "..." : courses.length}</div>
                            <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Active Courses</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Assigned Courses</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="group relative bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col h-full shadow-lg shadow-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 overflow-hidden">

                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 z-0 group-hover:scale-110 transition-transform"></div>

                                <div className="relative z-10 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                            <Layout className="w-6 h-6" />
                                        </div>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-100">
                                            {course.courseCode || "CODE"}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {course.name}
                                    </h3>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>{course.semesterName || "Semester N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Sparkles className="w-4 h-4 text-slate-400" />
                                            <span>{course.credits} Credits</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto pt-6 border-t border-slate-50">
                                    <Link
                                        href={`/teacher/courses/${course.id}`}
                                        className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:text-white transition-all duration-300 group-hover:shadow-md"
                                    >
                                        <span>Manage Course</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <BookOpen className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No Courses Assigned</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">It looks like you haven't been assigned any courses yet. Please contact your Department Admin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


