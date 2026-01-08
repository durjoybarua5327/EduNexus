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
            <div className={`p-12 text-center rounded-[2.5rem] border border-dashed ${isExam ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isExam ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                    {isExam ? <Clock className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Schedules Found</h3>
                <p className={`font-medium ${isExam ? 'text-rose-400' : 'text-emerald-400'}`}>
                    There are no {isExam ? 'exam schedules' : 'class routines'} posted at the moment.
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
                        group relative flex items-center gap-5 p-6 rounded-[2rem] 
                        border transition-all duration-500
                        ${isExam
                            ? 'bg-amber-100 hover:bg-gradient-to-br hover:from-rose-50 hover:to-orange-50 border-rose-100 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-200/40'
                            : 'bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 border-emerald-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-200/40'
                        } 
                    `}
                >
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-3
                        ${isExam
                            ? 'bg-gradient-to-br from-rose-100 to-orange-100 text-rose-600 group-hover:from-rose-500 group-hover:to-orange-500 group-hover:text-white'
                            : 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white'}
                    `}>
                        {isExam ? <Clock className="w-7 h-7" /> : <Calendar className="w-7 h-7" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border shadow-sm
                                ${isExam
                                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'}
                             `}>
                                {isExam ? 'Exam Schedule' : 'Class Routine'}
                            </span>
                        </div>
                        <h3 className={`font-bold text-slate-900 truncate text-base mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${isExam ? 'group-hover:from-rose-600 group-hover:to-orange-600' : 'group-hover:from-emerald-600 group-hover:to-teal-600'} transition-all`}>
                            {routine.content || (isExam ? "Exam Schedule Update" : "Class Routine Update")}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                            Posted {new Date(routine.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    {routine.url && (
                        <a
                            href={routine.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-transparent
                                ${isExam
                                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-200 hover:shadow-lg hover:shadow-rose-200'
                                    : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-200'
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
