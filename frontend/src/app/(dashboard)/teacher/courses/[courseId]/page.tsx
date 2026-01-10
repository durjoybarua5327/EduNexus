"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Users, FolderOpen, FileText, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CourseManagePage(props: { params: Promise<{ courseId: string }> }) {
    // Basic skeleton for Course Management
    // In real app, fetch course details
    const params = use(props.params); // robust unwrapping
    const { courseId } = params;

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <Link href="/teacher/courses" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
            </Link>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <BookOpen className="w-10 h-10 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">Course Dashboard</h1>
                <p className="text-slate-500 text-lg font-medium max-w-md mx-auto mb-8">
                    You are managing course <code className="bg-slate-100 px-2 py-1 rounded text-indigo-600">{courseId}</code>.
                    Full management features (Materials, Students, Notices) are being initialized.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg transition-all cursor-not-allowed opacity-70">
                        <FolderOpen className="w-8 h-8 text-indigo-500 mb-3 mx-auto" />
                        <h3 className="font-bold text-slate-700">Course Materials</h3>
                    </div>
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg transition-all cursor-not-allowed opacity-70">
                        <Users className="w-8 h-8 text-violet-500 mb-3 mx-auto" />
                        <h3 className="font-bold text-slate-700">Enrolled Students</h3>
                    </div>
                    <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-lg transition-all cursor-not-allowed opacity-70">
                        <FileText className="w-8 h-8 text-fuchsia-500 mb-3 mx-auto" />
                        <h3 className="font-bold text-slate-700">Notices</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
