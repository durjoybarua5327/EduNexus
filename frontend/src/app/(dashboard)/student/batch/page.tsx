"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, Mail, Trash2, Shield, ShieldOff } from "lucide-react";
import { Modal } from "@/components/Modal";
import toast from "react-hot-toast";

export default function StudentBatchPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const user = session?.user;
    const isCR = user?.role === "CR";

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [studentData, setStudentData] = useState({
        name: "",
        email: "",
        password: "changeme123",
        studentIdNo: ""
    });

    useEffect(() => {
        if (user?.batchId) {
            fetchStudents();
        }
    }, [user?.batchId]);

    async function fetchStudents() {
        try {
            const res = await fetch(`/api/dept/students?batchId=${user?.batchId}`);
            if (res.ok) {
                setStudents(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddStudent(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/dept/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...studentData,
                    batchId: user?.batchId,
                    departmentId: user?.departmentId, // This might be undefined in session if not careful 
                    role: 'STUDENT'
                }),
            });

            if (res.ok) {
                toast.success("Student added successfully");
                setIsAddOpen(false);
                setStudentData({ name: "", email: "", password: "changeme123", studentIdNo: "" });
                fetchStudents();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add student");
            }
        } catch (e) {
            toast.error("An error occurred");
        }
    }

    if (!user?.batchId) return <div className="p-10 text-center text-gray-500">You are not assigned to any batch.</div>;

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Classmates</h1>
                        <p className="text-gray-500 font-medium mt-1">
                            {isCR ? "Manage your batch students." : "View your batchmates."}
                        </p>
                    </div>
                </div>
                {isCR && (
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-0.5 font-semibold"
                    >
                        <Plus className="w-5 h-5" /> Add Student
                    </button>
                )}
                {/* Decoration */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading student list...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map(student => (
                        <div key={student.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${student.role === 'CR' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-500'}`}>
                                {student.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {student.name}
                                    {student.role === 'CR' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">CR</span>}
                                </h3>
                                <p className="text-sm text-gray-500">{student.studentIdNo || "No ID"}</p>
                            </div>
                        </div>
                    ))}
                    {students.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                            No students found in this batch yet.
                        </div>
                    )}
                </div>
            )}

            {/* Add Student Modal (CR Only) */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Student">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
                            placeholder="Student Name"
                            value={studentData.name} onChange={e => setStudentData({ ...studentData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
                            placeholder="student@example.com"
                            value={studentData.email} onChange={e => setStudentData({ ...studentData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required minLength={6}
                            value={studentData.password} onChange={e => setStudentData({ ...studentData, password: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID No</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 2021001"
                            value={studentData.studentIdNo} onChange={e => setStudentData({ ...studentData, studentIdNo: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-50">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add Student</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
