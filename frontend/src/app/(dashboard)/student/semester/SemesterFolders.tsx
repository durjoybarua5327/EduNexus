"use client";

import { useState } from "react";
import { Folder, FolderOpen, Book, BookOpen, ChevronRight, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SemesterFoldersProps {
    semesters: string[];
    currentSemester: string;
    departmentId: string;
    basePath?: string;
    isResourceView?: boolean;
    canManage?: boolean;
}

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
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.08 } }
            }}
            layout
            transition={{ layout: { type: "spring", stiffness: 200, damping: 30 } }}
        >
            {semesters.map((sem) => {
                const isExpanded = expandedSem === sem;
                const isCurrent = currentSemester === sem;

                return (
                    <motion.div
                        key={sem}
                        layout="position"
                        layoutId={`semester-folder-${sem}`}
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { type: "spring", stiffness: 260, damping: 20 }
                            }
                        }}
                        whileHover={!isExpanded ? { y: -8, scale: 1.02 } : {}}
                        transition={{
                            layout: { type: "spring", stiffness: 300, damping: 35, mass: 0.8 },
                            type: "spring", stiffness: 400, damping: 30
                        }}
                        className={`group relative ${isExpanded ? 'col-span-full md:col-span-2 lg:col-span-3' : ''}`}
                    >
                        {/* Outer Glow Effect for Current Semester */}
                        {isCurrent && !isExpanded && (
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 rounded-[2.2rem] blur-sm opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                        )}

                        {/* Card Container */}
                        <div className={`
                            relative overflow-hidden transition-all duration-500
                            ${isExpanded
                                ? 'bg-white rounded-[2.5rem] border border-indigo-200 shadow-2xl shadow-indigo-100/40 ring-1 ring-indigo-100'
                                : isCurrent
                                    ? 'bg-white/90 backdrop-blur-xl rounded-[2rem] border border-indigo-200 shadow-xl shadow-indigo-100/30 hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-300 cursor-pointer'
                                    : 'bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-100/40 hover:border-indigo-100 cursor-pointer'
                            }
                        `}
                            onClick={() => !isExpanded && handleSemClick(sem)}
                        >
                            {/* Decorative Gradient Blob - appears on hover */}
                            {!isExpanded && (
                                <>
                                    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                        bg-gradient-to-br from-indigo-100 to-violet-100
                                    `} />
                                    <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500
                                        bg-gradient-to-tr from-violet-50 to-indigo-50
                                    `} />
                                </>
                            )}

                            {/* Folder Header */}
                            <div className={`relative p-7 flex items-center gap-5 ${isExpanded ? 'bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-transparent border-b border-indigo-100/50' : ''}`}>
                                {/* Folder Icon with Gradient Background */}
                                <div className={`relative p-4 rounded-2xl transition-all duration-500 shadow-lg
                                    ${isExpanded
                                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200'
                                        : isCurrent
                                            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200 group-hover:shadow-xl group-hover:scale-105'
                                            : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 group-hover:from-indigo-500 group-hover:to-violet-600 group-hover:text-white group-hover:shadow-indigo-200 group-hover:scale-105'
                                    }
                                `}>
                                    {isExpanded ? <FolderOpen className="w-7 h-7" /> : <Folder className="w-7 h-7" />}

                                    {/* Sparkle indicator for current semester */}

                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-xl font-bold tracking-tight transition-colors duration-300
                                        ${isExpanded ? 'text-indigo-900' : isCurrent ? 'text-indigo-700 group-hover:text-indigo-800' : 'text-slate-800 group-hover:text-indigo-700'}
                                    `}>
                                        {sem} Semester
                                    </h3>

                                    {isCurrent ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                            </span>
                                            <span className="text-sm font-semibold text-indigo-600">Current Semester</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 font-medium mt-0.5">Past Semester</p>
                                    )}
                                </div>

                                {/* Expand/Close Actions */}
                                {!isExpanded && (
                                    <div className={`p-3 rounded-xl transition-all duration-300
                                        ${isCurrent
                                            ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                                            : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
                                    `}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                )}

                                {isExpanded && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setExpandedSem(null); }}
                                        className="px-4 py-2 rounded-xl font-bold text-sm bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>

                            {/* Folder Content (Courses) */}
                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            height: { type: "spring", stiffness: 300, damping: 35, mass: 0.8 },
                                            opacity: { duration: 0.25, ease: "easeOut" }
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-8 bg-gradient-to-b from-white to-slate-50/50">
                                            {loadingCourses ? (
                                                <div className="py-12 text-center">
                                                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-50 rounded-2xl">
                                                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                        <span className="font-semibold text-indigo-600">Loading subjects...</span>
                                                    </div>
                                                </div>
                                            ) : courses.length > 0 ? (
                                                <motion.div
                                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                                    initial="hidden"
                                                    animate="visible"
                                                    variants={{
                                                        visible: { transition: { staggerChildren: 0.05 } }
                                                    }}
                                                >
                                                    {courses.map((course: any) => {
                                                        const Wrapper = isResourceView ? Link : 'div';
                                                        const linkProps = isResourceView ? { href: `${basePath}?courseId=${course.id}` } : {};

                                                        return (
                                                            <motion.div
                                                                key={course.id}
                                                                variants={{
                                                                    hidden: { opacity: 0, y: 20 },
                                                                    visible: { opacity: 1, y: 0 }
                                                                }}
                                                                whileHover={{ y: -6, scale: 1.02 }}
                                                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                            >
                                                                <Wrapper
                                                                    {...(linkProps as any)}
                                                                    className={`group/card relative flex flex-col p-5 rounded-2xl border bg-white overflow-hidden transition-all duration-300
                                                                        ${isResourceView
                                                                            ? 'cursor-pointer border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40'
                                                                            : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'}
                                                                    `}
                                                                >
                                                                    {/* Course Card Decorative Blob */}
                                                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                                                                    <div className="relative flex items-start gap-4">
                                                                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100/50 text-indigo-600 group-hover/card:scale-110 group-hover/card:bg-gradient-to-br group-hover/card:from-indigo-500 group-hover/card:to-violet-600 group-hover/card:text-white transition-all duration-300 shadow-sm">
                                                                            <BookOpen className="w-5 h-5" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                                <span className="text-xs font-black px-2.5 py-1 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 rounded-lg tracking-wide">
                                                                                    {course.code}
                                                                                </span>
                                                                                <span className="text-xs text-slate-400 font-semibold">{course.credit} Cr</span>
                                                                            </div>
                                                                            <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover/card:text-indigo-700 transition-colors">
                                                                                {course.name}
                                                                            </h4>
                                                                            {!isResourceView && (
                                                                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                                                                                        {course.teacherName?.[0] || 'T'}
                                                                                    </div>
                                                                                    <span className="font-medium">{course.teacherName || 'TBA'}</span>
                                                                                </p>
                                                                            )}
                                                                            {isResourceView && (
                                                                                <p className="text-sm text-indigo-500 mt-3 font-bold flex items-center gap-1.5 group-hover/card:text-indigo-600 transition-colors">
                                                                                    View Files
                                                                                    <ChevronRight className="w-4 h-4 group-hover/card:translate-x-1 transition-transform" />
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Wrapper>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </motion.div>
                                            ) : (
                                                <div className="py-16 text-center">
                                                    <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                                        <Folder className="w-8 h-8 text-slate-300" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-700 mb-1">No subjects found</h4>
                                                    <p className="text-slate-500 font-medium">This semester doesn't have any subjects yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
