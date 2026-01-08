"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, User, Star, Trash2, UserPlus, Pencil } from "lucide-react";
import { EditStudentModal } from "./EditStudentModal";

interface BatchGridProps {
    students: any[];
    currentUserRole?: string;
    currentUserId?: string;
    currentUserIsTopCR?: boolean;
    batchId?: string;
    departmentId?: string;
    onStudentAdded?: () => void;
}

export function BatchGrid({ students, currentUserRole, currentUserId, currentUserIsTopCR, batchId, departmentId, onStudentAdded }: BatchGridProps) {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editStudent, setEditStudent] = useState<any | null>(null);

    const isCR = currentUserRole === 'CR';
    const isTopCR = isCR && currentUserIsTopCR;

    const handleDelete = async (studentId: string) => {
        setIsDeleting(true);
        try {
            // TODO: Implement API call to remove student from batch
            // await fetchAPI(`/dept/students/${studentId}/batch`, { method: 'DELETE' });
            console.log('Delete student:', studentId);
            // For now, just close the modal
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete student:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!students || students.length === 0) {
        return (
            <div className="py-24 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <h3 className="text-xl font-bold text-slate-400">No students found in this batch.</h3>
            </div>
        );
    }

    return (
        <>
            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                layout
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
            >
                {students.map((student) => (
                    <motion.div
                        key={student.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        whileHover={{ y: -6, scale: 1.01 }}
                    >
                        <div className={`relative group h-full rounded-3xl bg-white border transition-all duration-300 shadow-md hover:shadow-xl ${student.role === 'CR' ? 'border-violet-200 hover:border-violet-300 shadow-violet-100 hover:shadow-violet-200' :
                            student.role === 'TEACHER' ? 'border-amber-200 hover:border-amber-300 shadow-amber-100 hover:shadow-amber-200' :
                                'border-slate-100 hover:border-slate-200'
                            }`}>
                            {/* Card Content */}
                            <div className="relative p-4 flex flex-col items-center text-center h-full">

                                {/* Role Badge */}
                                {(student.role === 'CR' || student.role === 'TEACHER') && (
                                    <div className={`absolute top-3 right-3 p-1.5 rounded-lg shadow-sm ${student.role === 'CR' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {student.role === 'CR' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className={`relative w-20 h-20 rounded-full mb-3 overflow-hidden ring-4 ${student.role === 'CR' ? 'ring-violet-100' :
                                    student.role === 'TEACHER' ? 'ring-amber-100' :
                                        'ring-slate-100'
                                    }`}>
                                    {student.image ? (
                                        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${student.role === 'CR' ? 'bg-violet-600 text-white' :
                                            student.role === 'TEACHER' ? 'bg-amber-500 text-white' :
                                                'bg-slate-100 text-slate-400'
                                            }`}>
                                            <User className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <h3 className="text-base font-bold text-slate-900 mb-0.5 leading-tight">
                                    {student.name}
                                </h3>

                                {/* Student ID or Role with Top CR Badge */}
                                {student.role === 'CR' && student.isTopCR ? (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-3 px-2 py-1 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 text-white w-fit">
                                        <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                                        Top CR
                                    </div>
                                ) : (
                                    <div className={`text-[10px] font-semibold uppercase tracking-wide mb-3 px-2 py-0.5 rounded-md ${student.role === 'CR' ? 'bg-violet-50 text-violet-600' :
                                        student.role === 'TEACHER' ? 'bg-amber-50 text-amber-600' :
                                            'bg-slate-50 text-slate-500'
                                        }`}>
                                        {student.role === 'TEACHER' ? 'Instructor' : student.role === 'CR' ? 'Class Rep' : student.studentIdNo || "Student"}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-auto w-full space-y-2">
                                    {/* Profile Button */}
                                    <a
                                        href={`/student/profile?userId=${student.id}`}
                                        className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${student.role === 'CR' ? 'bg-violet-600 text-white hover:bg-violet-700' :
                                            student.role === 'TEACHER' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                                                'bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white'
                                            }`}
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Profile</span>
                                    </a>

                                    {/* Edit Button - Top CR: Can edit students and normal CRs, Normal CR: Can only edit students */}
                                    {isCR && student.role !== 'TEACHER' && student.id !== currentUserId && (
                                        isTopCR
                                            ? !student.isTopCR  // Top CR can edit students and normal CRs (not other Top CRs)
                                            : student.role === 'STUDENT'  // Normal CR can only edit students
                                    ) && (
                                            <button
                                                onClick={() => setEditStudent(student)}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                        )}

                                    {/* Delete Button - Top CR: Can delete students and normal CRs, Normal CR: Can only delete students */}
                                    {isCR && student.role !== 'TEACHER' && student.id !== currentUserId && (
                                        isTopCR
                                            ? !student.isTopCR  // Top CR can delete students and normal CRs (not other Top CRs)
                                            : student.role === 'STUDENT'  // Normal CR can only delete students
                                    ) && (
                                            <button
                                                onClick={() => setDeleteConfirm(student.id)}
                                                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Remove</span>
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>



            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Remove Student?</h3>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to remove this student from the batch? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Student Modal */}
            <EditStudentModal
                isOpen={!!editStudent}
                onClose={() => setEditStudent(null)}
                student={editStudent}
                onSuccess={onStudentAdded}
            />

        </>
    );
}
