"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Folder, ArrowRight } from "lucide-react";

export function ResourcesGrid({ courses }: { courses: any[] }) {
    if (!courses || courses.length === 0) {
        return (
            <div className="py-24 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <h3 className="text-xl font-bold text-slate-400">No courses found</h3>
            </div>
        );
    }

    return (
        <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.08 } }
            }}
        >
            {courses.map((course) => (
                <motion.div
                    key={course.id}
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: { type: "spring", stiffness: 260, damping: 20 }
                        }
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                >
                    <Link
                        href={`/student/resources?courseId=${course.id}`}
                        className="group relative block h-full bg-white rounded-[2rem] p-1 border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-2xl hover:shadow-amber-100/50 hover:border-amber-100 transition-all duration-300"
                    >
                        <div className="relative h-full bg-white rounded-[1.8rem] p-8 flex flex-col overflow-hidden">
                            {/* Decorative blobs */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />

                            <div className="relative z-10 w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                                <Folder className="w-7 h-7" />
                            </div>

                            <div className="relative z-10 mb-2">
                                <span className="px-3 py-1 text-[10px] font-black tracking-widest text-slate-400 bg-slate-50 rounded-lg uppercase">
                                    {course.code}
                                </span>
                            </div>

                            <h3 className="relative z-10 text-xl font-extrabold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                                {course.name}
                            </h3>

                            <p className="relative z-10 text-sm text-slate-500 font-medium mb-6">
                                Access lecture notes, slides, and assignments.
                            </p>

                            <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                                <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:underline decoration-2 underline-offset-4">
                                    Browse Files
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}
