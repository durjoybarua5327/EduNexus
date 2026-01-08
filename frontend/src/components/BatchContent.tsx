"use client";

import { useState, useEffect } from "react";
import { BatchGrid } from "@/components/BatchGrid";
import { UserPlus } from "lucide-react";
import { AddStudentModal } from "./AddStudentModal";

interface BatchContentProps {
    initialStudents: any[];
    currentUserRole: string;
    currentUserId: string;
    currentUserIsTopCR?: boolean;
    batchId: string;
    departmentId: string;
    batchName?: string;
    showAddButton?: boolean;
    isAddModalOpen: boolean;
    onCloseAddModal: () => void;
}

export function BatchContent({
    initialStudents,
    currentUserRole,
    currentUserId,
    currentUserIsTopCR,
    batchId,
    departmentId,
    batchName,
    isAddModalOpen,
    onCloseAddModal
}: BatchContentProps) {
    const [students, setStudents] = useState<any[]>(initialStudents);
    const [searchQuery, setSearchQuery] = useState("");

    const isCR = currentUserRole === 'CR';

    // Filter students based on search query
    const filteredStudents = students.filter((student: any) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.studentIdNo && student.studentIdNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );



    const handleStudentAdded = async () => {
        // Fetch updated student list
        try {
            const response = await fetch(`/api/dept/students?batchId=${batchId}`);
            if (response.ok) {
                const updatedStudents = await response.json();

                // Sort: Teachers, then CRs, then Students
                updatedStudents.sort((a: any, b: any) => {
                    if (a.role === 'TEACHER') return -1;
                    if (b.role === 'TEACHER') return 1;
                    if (a.role === 'CR' && b.role !== 'CR') return -1;
                    if (a.role !== 'CR' && b.role === 'CR') return 1;
                    return a.name.localeCompare(b.name);
                });

                setStudents(updatedStudents);
            }
        } catch (error) {
            console.error('Failed to refresh student list:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex justify-center mb-8">
                <input
                    type="text"
                    placeholder="Search by Name, ID or Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-5 py-3 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* Student Grid */}
            <BatchGrid
                students={filteredStudents}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                currentUserIsTopCR={currentUserIsTopCR}
                batchId={batchId}
                departmentId={departmentId}
                onStudentAdded={handleStudentAdded}
            />

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={onCloseAddModal}
                batchId={batchId}
                departmentId={departmentId}
                onSuccess={handleStudentAdded}
            />
        </div>
    );
}
