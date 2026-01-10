"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/user-context";
import { Users, UserPlus, UserMinus, Crown, Shield, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ManageCRsPage() {
    const { user } = useUser();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/cr/manage-crs');
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to fetch students");
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handlePromote = async (studentId: string, studentName: string) => {
        if (!confirm(`Promote ${studentName} to Class Representative?`)) return;

        setActionLoading(studentId);
        try {
            const res = await fetch('/api/cr/manage-crs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });

            if (res.ok) {
                toast.success(`${studentName} promoted to CR`);
                fetchStudents();
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to promote student");
            }
        } catch (error) {
            console.error("Error promoting student:", error);
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDemote = async (userId: string, userName: string) => {
        if (!confirm(`Demote ${userName} back to Student?`)) return;

        setActionLoading(userId);
        try {
            const res = await fetch(`/api/cr/manage-crs?userId=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success(`${userName} demoted to Student`);
                fetchStudents();
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to demote CR");
            }
        } catch (error) {
            console.error("Error demoting CR:", error);
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    // Check if current user is Top CR
    const isTopCR = user?.isTopCR === true;

    if (!isTopCR) {
        return (
            <div className="max-w-7xl mx-auto p-6 md:p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                    <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-amber-900 mb-2">Top CR Access Only</h2>
                    <p className="text-amber-700">Only the Top CR can manage class representatives.</p>
                </div>
            </div>
        );
    }

    const topCRs = students.filter(s => s.isTopCR);
    const regularCRs = students.filter(s => s.role === 'CR' && !s.isTopCR);
    const regularStudents = students.filter(s => s.role === 'STUDENT');

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="relative">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
                            <Users className="w-10 h-10 text-indigo-600" />
                            Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Class Representatives</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm max-w-lg">
                            Promote students to CR or demote existing CRs. Only you (Top CR) can manage representatives.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Top CR Section */}
                    {topCRs.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <Crown className="w-6 h-6 text-amber-500" />
                                <h2 className="text-xl font-bold text-slate-800">Top CR</h2>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                                    {topCRs.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topCRs.map(student => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        isTopCR={true}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Regular CRs Section */}
                    {regularCRs.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <Shield className="w-6 h-6 text-indigo-500" />
                                <h2 className="text-xl font-bold text-slate-800">Class Representatives</h2>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                    {regularCRs.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {regularCRs.map(student => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        onDemote={handleDemote}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Regular Students Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <Users className="w-6 h-6 text-slate-500" />
                            <h2 className="text-xl font-bold text-slate-800">Students</h2>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                {regularStudents.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {regularStudents.map(student => (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                    onPromote={handlePromote}
                                    actionLoading={actionLoading}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StudentCard({ student, onPromote, onDemote, isTopCR, actionLoading }: any) {
    const isLoading = actionLoading === student.id;

    return (
        <div className={`bg-white rounded-2xl border p-5 shadow-md hover:shadow-lg transition-all duration-300
            ${isTopCR ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50' :
                student.role === 'CR' ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50' :
                    'border-slate-200'
            }`}>
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md
                        ${isTopCR ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                            student.role === 'CR' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' :
                                'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>
                        {student.image ? (
                            <img src={student.image} alt={student.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            student.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    {isTopCR && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                            <Crown className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{student.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                    {student.studentIdNo && (
                        <p className="text-xs text-slate-400 mt-1">ID: {student.studentIdNo}</p>
                    )}
                    <div className="mt-2">
                        {isTopCR && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                                <Crown className="w-3 h-3" /> TOP CR
                            </span>
                        )}
                        {student.role === 'CR' && !isTopCR && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                                <Shield className="w-3 h-3" /> CR
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            {onPromote && (
                <button
                    onClick={() => onPromote(student.id, student.name)}
                    disabled={isLoading}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Promote to CR
                </button>
            )}

            {onDemote && (
                <button
                    onClick={() => onDemote(student.id, student.name)}
                    disabled={isLoading}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                    Demote to Student
                </button>
            )}
        </div>
    );
}
