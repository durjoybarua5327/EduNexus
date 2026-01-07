"use client";

import { motion } from "framer-motion";
import { Clock, FileText, Download, Calendar } from "lucide-react";

interface RoutineListProps {
    routines: any[];
    type: 'CLASS' | 'EXAM';
}

export function RoutineList({ routines, type }: RoutineListProps) {
    const isExam = type === 'EXAM';
    const colorClass = isExam ? 'rose' : 'emerald';

    if (!routines || routines.length === 0) {
        return (
            <div className={`p-12 text-center rounded-[2rem] border border-dashed ${isExam ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <p className={`font-medium ${isExam ? 'text-rose-400' : 'text-emerald-400'}`}>
                    No {isExam ? 'exam schedules' : 'class routines'} posted yet.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            className="grid gap-4"
            initial="hidden"
            animate="visible"
            variants={{
                visible: { transition: { staggerChildren: 0.1 } }
            }}
        >
            {routines.map((routine) => (
                <motion.div
                    key={routine.id}
                    variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: { type: "spring", stiffness: 200, damping: 20 }
                        }
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={`
                        group relative flex items-center gap-5 p-5 bg-white rounded-[1.5rem] 
                        border transition-all duration-300
                        ${isExam
                            ? 'border-rose-100 shadow-rose-100/50 hover:border-rose-200 hover:shadow-rose-200/50'
                            : 'border-emerald-100 shadow-emerald-100/50 hover:border-emerald-200 hover:shadow-emerald-200/50'
                        } shadow-lg
                    `}
                >
                    <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300
                        ${isExam ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'}
                    `}>
                        {isExam ? <Clock className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate text-lg">
                            {routine.content || (isExam ? "Exam Schedule Update" : "Class Routine Update")}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${isExam ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {isExam ? 'Exam' : 'Class'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                • Posted {new Date(routine.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {routine.url && (
                        <a
                            href={routine.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                ${isExam
                                    ? 'bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white'
                                    : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                                }
                            `}
                            title="Download PDF"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                    )}
                </motion.div>
            ))}
        </motion.div>
    );
}
