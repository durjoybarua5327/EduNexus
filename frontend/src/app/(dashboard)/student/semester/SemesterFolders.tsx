"use client";

import { useState } from "react";
import { Folder, FolderOpen, Book, BookOpen, ChevronRight, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SemesterFoldersProps {
    semesters: string[];
    currentSemester: string;
    departmentId: string;
    basePath?: string;
    isResourceView?: boolean;
    canManage?: boolean;
}

import Link from "next/link";

export function SemesterFolders({ semesters, currentSemester, departmentId, basePath, isResourceView = false, canManage = false }: SemesterFoldersProps) {
    const [expandedSem, setExpandedSem] = useState<string | null>(!basePath && semesters.includes(currentSemester) ? currentSemester : null);
    const [courses, setCourses] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);

    async function handleSemClick(sem: string) {
        if (expandedSem === sem) {
            setExpandedSem(null);
            return;
        }

        setExpandedSem(sem);
        setLoadingCourses(true);
        try {
            // Fetch courses for this semester
            // Note: We need to implement this API endpoint separately if it doesn't support 'semester' query param as a name
            // For now assuming we can pass the name or lookup ID via another way.
            // A better way is if 'semesters' prop contained {id: string, name: string}
            // But let's assume we fetch by name or convert logic later.
            // Using a temporary fetch structure:
            const res = await fetch(`/api/student/subjects?semester=${sem}&departmentId=${departmentId}`);
            if (res.ok) {
                setCourses(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCourses(false);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.map((sem) => {
                const isExpanded = expandedSem === sem;
                const isCurrent = currentSemester === sem;

                return (
                    <div
                        key={sem}
                        className={`bg-white rounded-2xl border transition-all duration-300 relative overflow-hidden ${isExpanded ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-100 col-span-full md:col-span-2 lg:col-span-3' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 cursor-pointer'
                            }`}
                        onClick={() => !isExpanded && handleSemClick(sem)}
                    >
                        {/* Folder Header */}
                        <div className={`p-6 flex items-center gap-4 ${isExpanded ? 'bg-indigo-50/50' : ''}`}>
                            <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' :
                                isCurrent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                }`}>
                                {isExpanded ? <FolderOpen className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
                            </div>

                            <div className="flex-1">
                                <h3 className={`text-lg font-bold ${isCurrent ? 'text-green-700' : 'text-gray-900'}`}>
                                    {sem} Semester
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {isCurrent ? 'Current Semester' : 'Past Semester'}
                                </p>
                            </div>

                            {isExpanded && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedSem(null); }}
                                    className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        {/* Folder Content (Courses) */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-indigo-100/50"
                                >
                                    <div className="p-6 bg-white">
                                        {loadingCourses ? (
                                            <div className="py-8 text-center text-gray-400 animate-pulse">Loading subjects...</div>
                                        ) : courses.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {courses.map((course: any) => {
                                                    const Wrapper = isResourceView ? Link : 'div';
                                                    const linkProps = isResourceView ? { href: `${basePath}?courseId=${course.id}` } : {};

                                                    return (
                                                        <Wrapper
                                                            key={course.id}
                                                            {...linkProps} // @ts-ignore
                                                            className={`group flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all bg-gray-50/50 hover:bg-white ${isResourceView ? 'cursor-pointer' : ''}`}
                                                        >
                                                            <div className="mt-1 p-2 bg-white rounded-lg border border-gray-100 shadow-sm text-indigo-600 group-hover:scale-105 transition-transform">
                                                                <BookOpen className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                                                                        {course.code}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">{course.credit} Cr</span>
                                                                </div>
                                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-700 transition-colors">
                                                                    {course.name}
                                                                </h4>
                                                                {!isResourceView && (
                                                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                            {course.teacherName?.[0] || 'T'}
                                                                        </div>
                                                                        {course.teacherName || 'TBA'}
                                                                    </p>
                                                                )}
                                                                {isResourceView && (
                                                                    <p className="text-xs text-indigo-500 mt-1 font-semibold flex items-center gap-1">
                                                                        View Files <ChevronRight className="w-3 h-3" />
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </Wrapper>
                                                    );
                                                })}

                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-gray-400 italic">
                                                No subjects found for this semester.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
