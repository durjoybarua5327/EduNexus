"use client";

import { UploadCloud, File, Calendar, HardDrive, Trash2, Link as LinkIcon, ExternalLink, Download } from "lucide-react";
import { useState } from "react";

export default function GenericTeacherPage() {
    // This is for Uploads
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 p-8 md:p-12 text-white">
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight flex items-center gap-3">
                        <UploadCloud className="w-10 h-10 md:w-12 md:h-12 text-indigo-200" />
                        My Uploads
                    </h1>
                    <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-xl">
                        Manage your shared resources, lecture notes, and assignments across all your courses.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <HardDrive className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No Uploads Yet</h3>
                <p className="text-slate-500 mt-2 max-w-sm">Files you upload to your courses will appear here for easy management.</p>
            </div>
        </div>
    );
}
