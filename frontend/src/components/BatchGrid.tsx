"use client";

import { motion } from "framer-motion";
import { Mail, ShieldCheck, User, Star } from "lucide-react";

export function BatchGrid({ students }: { students: any[] }) {
    if (!students || students.length === 0) {
        return (
            <div className="py-24 text-center bg-indigo-50/50 rounded-[2.5rem] border border-dashed border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-400">No students found in this batch.</h3>
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
            {students.map((student) => (
                <motion.div
                    key={student.id}
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
                    <div className={`relative group p-1 rounded-[2.5rem] bg-gradient-to-br transition-all duration-300 ${student.role === 'CR' ? 'from-indigo-400 to-violet-400 shadow-xl shadow-indigo-200' :
                            student.role === 'TEACHER' ? 'from-amber-400 to-orange-400 shadow-xl shadow-amber-200' :
                                'from-white to-white border border-indigo-50 hover:border-indigo-200 shadow-lg shadow-gray-100 hover:shadow-2xl hover:shadow-indigo-100'
                        }`}>
                        <div className="relative bg-white rounded-[2.3rem] p-6 flex flex-col items-center text-center h-full overflow-hidden">

                            {/* Role Banners */}
                            {student.role === 'CR' && (
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-indigo-50 to-transparent" />
                            )}
                            {student.role === 'TEACHER' && (
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-amber-50 to-transparent" />
                            )}

                            {/* Badge Icons */}
                            {student.role === 'CR' && (
                                <div className="absolute top-4 right-4 bg-white p-1.5 rounded-full shadow-sm text-indigo-600 ring-4 ring-indigo-50">
                                    <ShieldCheck className="w-5 h-5 fill-indigo-50" />
                                </div>
                            )}
                            {student.role === 'TEACHER' && (
                                <div className="absolute top-4 right-4 bg-white p-1.5 rounded-full shadow-sm text-amber-600 ring-4 ring-amber-50">
                                    <Star className="w-5 h-5 fill-amber-50" />
                                </div>
                            )}

                            {/* Avatar */}
                            <div className={`relative w-28 h-28 rounded-full mb-5 p-1 bg-white shadow-lg ${student.role === 'CR' ? 'ring-4 ring-indigo-100' :
                                    student.role === 'TEACHER' ? 'ring-4 ring-amber-100' :
                                        'ring-4 ring-gray-50'
                                }`}>
                                <div className="w-full h-full rounded-full overflow-hidden relative">
                                    {student.image ? (
                                        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${student.role === 'CR' ? 'bg-indigo-600 text-white' :
                                                student.role === 'TEACHER' ? 'bg-amber-500 text-white' :
                                                    'bg-gray-100 text-gray-300'
                                            }`}>
                                            <User className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight px-2">
                                {student.name}
                            </h3>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-6 px-3 py-1 rounded-full ${student.role === 'CR' ? 'bg-indigo-100 text-indigo-700' :
                                    student.role === 'TEACHER' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-500'
                                }`}>
                                {student.role === 'TEACHER' ? 'Instructor' : student.studentIdNo || "Student"}
                            </div>

                            {/* Action Button */}
                            <div className="mt-auto w-full">
                                <a
                                    href={`mailto:${student.email}`}
                                    className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${student.role === 'CR' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' :
                                            student.role === 'TEACHER' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200' :
                                                'bg-gray-50 text-gray-600 hover:bg-gray-900 hover:text-white'
                                        }`}
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>Contact</span>
                                </a>
                            </div>

                        </div>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
