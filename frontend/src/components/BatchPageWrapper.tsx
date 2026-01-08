"use client";

import { useState } from "react";
import { BatchContent } from "./BatchContent";
import { Plus } from "lucide-react";

interface BatchPageWrapperProps {
    students: any[];
    profile: any;
    userId: string;
}

export function BatchPageWrapper({ students, profile, userId }: BatchPageWrapperProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Beautiful Header with Add Student Button */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        My Batch
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium">
                        {profile.batchName} \u2022 {students.length} {students.length === 1 ? 'Member' : 'Members'}
                    </p>
                </div>

                {/* Add Student Button (CR Only) - Top Right, Same Line */}
                {profile.role === 'CR' && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-300 font-bold hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        Add Student
                    </button>
                )}
            </div>

            <BatchContent
                initialStudents={students}
                currentUserRole={profile.role}
                currentUserId={userId}
                currentUserIsTopCR={profile.isTopCR}
                batchId={profile.batchId}
                departmentId={profile.departmentId}
                batchName={profile.batchName}
                isAddModalOpen={isAddModalOpen}
                onCloseAddModal={() => setIsAddModalOpen(false)}
            />
        </div>
    );
}
