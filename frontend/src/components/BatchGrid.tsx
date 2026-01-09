"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, User, Star, Trash2, UserPlus, Pencil, GraduationCap, MoreHorizontal } from "lucide-react";
import { EditStudentModal } from "./EditStudentModal";
import Link from "next/link";

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
            // TODO: Implement API call to remove student
            console.log('Delete student:', studentId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete student:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!students || students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <User className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No students found</h3>
                <p className="text-slate-500 max-w-sm mt-2">Start building your batch by adding students.</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                layout
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
            >
                {students.map((student) => {
                    const isTeacher = student.role === 'TEACHER';
                    const isStudentCR = student.role === 'CR';

                    return (
                        <motion.div
                            key={student.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -8 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="group relative"
                        >
                            {/* Card Background & Border */}
                            <div className={`
                                relative h-full bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden
                                ${isTeacher
                                    ? 'border-amber-100 shadow-xl shadow-amber-100/20 hover:shadow-2xl hover:shadow-amber-100/40 hover:border-amber-200'
                                    : isStudentCR
                                        ? 'border-violet-100 shadow-xl shadow-violet-100/20 hover:shadow-2xl hover:shadow-violet-100/40 hover:border-violet-200'
                                        : 'border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-200/60 hover:border-slate-200'
                                }
                            `}>
                                {/* Decorative Gradient Blob */}
                                <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b opacity-50 transition-opacity duration-500
                                    ${isTeacher
                                        ? 'from-amber-50/80 to-transparent group-hover:opacity-100'
                                        : isStudentCR
                                            ? 'from-violet-50/80 to-transparent group-hover:opacity-100'
                                            : 'from-slate-50/80 to-transparent group-hover:opacity-80'
                                    }
                                `} />

                                <div className="relative p-6 flex flex-col items-center text-center h-full">

                                    {/* Role Badge (Absolute Top Right) */}
                                    {(isStudentCR || isTeacher) && (
                                        <div className={`absolute top-5 right-5 p-2 rounded-xl backdrop-blur-md border shadow-sm
                                            ${isTeacher
                                                ? 'bg-amber-100/50 border-amber-200 text-amber-600'
                                                : 'bg-violet-100/50 border-violet-200 text-violet-600'
                                            }
                                        `}>
                                            {isTeacher ? <Star className="w-4 h-4 fill-current" /> : <ShieldCheck className="w-4 h-4" />}
                                        </div>
                                    )}

                                    {/* Avatar Section */}
                                    <div className="relative mt-2 mb-5 group-hover:scale-105 transition-transform duration-500">
                                        <div className={`
                                            relative w-24 h-24 rounded-full p-1.5 shadow-2xl
                                            ${isTeacher
                                                ? 'bg-gradient-to-br from-amber-300 to-orange-400'
                                                : isStudentCR
                                                    ? 'bg-gradient-to-br from-violet-400 to-fuchsia-400'
                                                    : 'bg-gradient-to-br from-slate-100 to-slate-200'
                                            }
                                        `}>
                                            <div className="w-full h-full rounded-full overflow-hidden bg-white border-4 border-white">
                                                {student.image ? (
                                                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                        <User className={`w-10 h-10 ${isTeacher ? 'text-amber-300' : isStudentCR ? 'text-violet-300' : 'text-slate-300'}`} />
                                                    </div>
                                                )}
                                            </div>


                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {student.name}
                                        </h3>

                                        {isStudentCR && student.isTopCR ? (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-violet-200">
                                                <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                                                Top CR
                                            </div>
                                        ) : (
                                            <p className={`text-xs font-semibold uppercase tracking-wider
                                                ${isTeacher ? 'text-amber-600' : isStudentCR ? 'text-violet-600' : 'text-slate-400'}
                                            `}>
                                                {isTeacher ? 'Faculty Member' : isStudentCR ? 'Class Representative' : student.studentIdNo || 'Student'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto w-full grid grid-cols-1 gap-2">
                                        <Link
                                            href={`/student/profile?userId=${student.id}`}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-300 border border-slate-100 hover:border-slate-200 flex items-center justify-center gap-2"
                                        >
                                            <User className="w-4 h-4" /> View Profile
                                        </Link>

                                        {/* CR Actions */}
                                        {isCR && !isTeacher && student.id !== currentUserId && (
                                            (isTopCR ? !student.isTopCR : student.role === 'STUDENT')
                                        ) && (
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    <button
                                                        onClick={() => setEditStudent(student)}
                                                        className="py-2.5 rounded-xl font-bold text-sm bg-blue-50/50 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(student.id)}
                                                        className="py-2.5 rounded-xl font-bold text-sm bg-rose-50/50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Modal Components */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Trash2 className="w-40 h-40 text-rose-500 -rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-inner">
                                    <Trash2 className="w-8 h-8" />
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-3">Remove Student?</h3>
                                <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                    Are you sure you want to remove this student? This action cannot be undone and they will lose access.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
                                        disabled={isDeleting}
                                        className="py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all hover:scale-[1.02]"
                                    >
                                        {isDeleting ? 'Removing...' : 'Yes, Remove'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EditStudentModal
                isOpen={!!editStudent}
                onClose={() => setEditStudent(null)}
                student={editStudent}
                onSuccess={onStudentAdded}
            />
        </>
    );
}
