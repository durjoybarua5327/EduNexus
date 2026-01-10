"use client";

import { use, useEffect, useState } from "react";
import { BatchGrid } from "@/components/BatchGrid";
import { Loader2, ArrowLeft, Users, Search } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";

export default function CourseStudentsPage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const { courseId } = params;
    const { user } = useUser();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchStudents() {
            try {
                const res = await fetch(`/api/course/${courseId}/students`);
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, [courseId]);

    const filteredStudents = students.filter((student: any) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.studentIdNo && student.studentIdNo.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/teacher/courses/${courseId}`} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            Enrolled Students
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {students.length} students enrolled.
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-6">
                    <BatchGrid
                        students={filteredStudents}
                        currentUserRole={user?.role}
                        currentUserId={user?.id}
                    // Teachers generally view students, functionality to remove/add might be restricted to Admin or specific endpoints
                    />
                </div>
            )}
        </div>
    );
}
