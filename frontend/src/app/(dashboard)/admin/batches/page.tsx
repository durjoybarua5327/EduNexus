"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Layers, Users, Trash2, Calendar, Eye, Shield, ShieldOff, Mail } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

export default function BatchesPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const deptId = session?.user?.departmentId;

    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBatch, setEditingBatch] = useState<any>(null);

    // Student View State
    const [isViewStudentsOpen, setIsViewStudentsOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [batchStudents, setBatchStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Semesters State
    const [semesters, setSemesters] = useState<any[]>([]);
    const [loadingSemesters, setLoadingSemesters] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        year: new Date().getFullYear(),
        section: "A",
        startMonth: "January",
        currentSemester: "1st"
    });

    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [studentData, setStudentData] = useState({
        name: "",
        email: "",
        password: "changeme123", // Default recommendation
        studentIdNo: ""
    });

    async function handleAddStudent(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/dept/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...studentData, batchId: selectedBatch.id, departmentId: deptId }),
            });
            if (res.ok) {
                toast.success("Student added");
                setIsAddStudentOpen(false);
                setStudentData({ name: "", email: "", password: "changeme123", studentIdNo: "" });
                // Refresh student list
                const listRes = await fetch(`/api/dept/students?batchId=${selectedBatch.id}`);
                if (listRes.ok) setBatchStudents(await listRes.json());
            } else {
                toast.error("Failed to add student");
            }
        } catch (e) { toast.error("Error adding student"); }
    }

    useEffect(() => {
        if (deptId) {
            fetchBatches();
            fetchSemesters();
        }
    }, [deptId]);

    async function fetchBatches() {
        try {
            const res = await fetch(`/api/dept/batches?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setBatches(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function fetchSemesters() {
        setLoadingSemesters(true);
        try {
            const res = await fetch(`/api/dept/semesters?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setSemesters(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoadingSemesters(false); }
    }

    async function handleViewStudents(batch: any) {
        setSelectedBatch(batch);
        setIsViewStudentsOpen(true);
        setLoadingStudents(true);
        try {
            const res = await fetch(`/api/dept/students?batchId=${batch.id}`);
            if (res.ok) setBatchStudents(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingStudents(false); }
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleCRAction(studentId: string, action: 'PROMOTE' | 'REVOKE') {
        setConfirmAction({
            title: action === 'PROMOTE' ? "Promote Student" : "Revoke CR Status",
            message: action === 'PROMOTE'
                ? "Are you sure you want to make this student a Class Representative?"
                : "Are you sure you want to remove this student's CR status?",
            confirmText: action === 'PROMOTE' ? "Promote" : "Revoke",
            isDanger: action === 'REVOKE',
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/dept/students", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ studentId, action, departmentId: deptId }),
                    });

                    if (res.ok) {
                        toast.success(action === 'PROMOTE' ? "CR assigned" : "CR revoked");
                        setBatchStudents(prev => prev.map(s =>
                            s.id === studentId ? { ...s, role: action === 'PROMOTE' ? 'CR' : 'STUDENT' } : s
                        ));
                        fetchBatches();
                    } else {
                        const data = await res.json();
                        toast.error(data.error || "Failed to update role");
                    }
                } catch (e) { toast.error("Error"); }
            }
        });
    }

    async function handleSendCredentials() {
        toast.success("Credentials sent to all CRs (Simulation)");
    }

    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    function handleEdit(batch: any) {
        setEditingBatch(batch);
        setFormData({
            name: batch.name,
            year: batch.year,
            section: batch.section || "A",
            startMonth: batch.startMonth || "January",
            currentSemester: batch.currentSemester || "1st"
        });
        setIsEditMode(true);
        setIsAddOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const now = Date.now();
        if (!isEditMode && now - lastSubmitTime < 5000) {
            toast.error(`Please wait ${Math.ceil((5000 - (now - lastSubmitTime)) / 1000)}s before creating another batch.`);
            return;
        }

        try {
            const res = await fetch("/api/dept/batches", {
                method: isEditMode ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEditMode ? { id: editingBatch.id, ...formData, actorId: session?.user?.id } : { ...formData, departmentId: deptId, actorId: session?.user?.id }),
            });
            if (res.ok) {
                if (!isEditMode) setLastSubmitTime(Date.now());
                toast.success(isEditMode ? "Batch updated successfully" : "Batch created successfully");
                setIsAddOpen(false);
                setIsEditMode(false);
                setEditingBatch(null);
                setFormData({ name: "", year: new Date().getFullYear(), section: "A", startMonth: "January", currentSemester: "1st" });
                fetchBatches();
            } else {
                toast.error("Failed to create batch");
            }
        } catch (e) { toast.error("An error occurred"); }
    }

    async function handleDelete(id: string) {
        setConfirmAction({
            title: "Delete Batch",
            message: "Are you sure? This will delete the batch and unlink all students. This action cannot be undone.",
            isDanger: true,
            confirmText: "Delete Batch",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/batches?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Batch deleted");
                        fetchBatches();
                    }
                } catch (e) { toast.error("Failed to delete"); }
            }
        });
    }

    if (!deptId) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Batch & CR Management</h1>
                    <p className="text-gray-500">Organize students into batches and assign representatives.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Create Batch
                </button>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map(batch => (
                        <div key={batch.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(batch)} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit Batch">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleDelete(batch.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete Batch">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {batch.year}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">Sec {batch.section || "A"}</span>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-500">Class Representatives</span>
                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{batch.crs?.length || 0}</span>
                                    </div>
                                    <div className="flex -space-x-2 mb-3">
                                        {batch.crs && batch.crs.length > 0 ? batch.crs.map((cr: any) => (
                                            <div key={cr.id} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white ring-2 ring-transparent">
                                                {cr.name[0]}
                                            </div>
                                        )) : (
                                            <span className="text-xs text-gray-400 italic">No CRs assigned</span>
                                        )}
                                    </div>

                                    <button onClick={() => handleViewStudents(batch)} className="w-full py-2 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                        <Users className="w-4 h-4" /> View Students & Manage CRs
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {batches.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            No batches found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Create Batch Modal */}
            <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setIsEditMode(false); setEditingBatch(null); }} title={isEditMode ? "Edit Batch" : "Create New Batch"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required placeholder="e.g. CSE-25"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <input type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required min="2000" max="2100"
                                value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="A"
                                value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none max-h-40 overflow-y-auto"
                                value={formData.startMonth}
                                onChange={e => setFormData({ ...formData, startMonth: e.target.value })}
                                size={5}>
                                <option value="January">January</option>
                                <option value="July">July</option>
                                <option value="February">February</option>
                                <option value="March">March</option>
                                <option value="April">April</option>
                                <option value="May">May</option>
                                <option value="June">June</option>
                                <option value="August">August</option>
                                <option value="September">September</option>
                                <option value="October">October</option>
                                <option value="November">November</option>
                                <option value="December">December</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none max-h-40 overflow-y-auto"
                                value={formData.currentSemester}
                                onChange={e => setFormData({ ...formData, currentSemester: e.target.value })}
                                disabled={loadingSemesters}
                                size={semesters.length > 5 ? 5 : undefined}>
                                {loadingSemesters ? (
                                    <option>Loading semesters...</option>
                                ) : semesters.length > 0 ? (
                                    semesters.map(sem => (
                                        <option key={sem.id} value={sem.name}>{sem.name} Semester</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="1st">1st Semester</option>
                                        <option value="2nd">2nd Semester</option>
                                        <option value="3rd">3rd Semester</option>
                                        <option value="4th">4th Semester</option>
                                        <option value="5th">5th Semester</option>
                                        <option value="6th">6th Semester</option>
                                        <option value="7th">7th Semester</option>
                                        <option value="8th">8th Semester</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => { setIsAddOpen(false); setIsEditMode(false); setEditingBatch(null); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">{isEditMode ? "Update Batch" : "Create Batch"}</button>
                    </div>
                </form>
            </Modal>

            {/* Students List Modal */}
            <Modal isOpen={isViewStudentsOpen} onClose={() => setIsViewStudentsOpen(false)} title={`Students: ${selectedBatch?.name || ''}`}>
                <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">{batchStudents.length} Students Enrolled</p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsAddStudentOpen(true)} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
                                <Plus className="w-3 h-3" /> Add Student
                            </button>
                            <button onClick={handleSendCredentials} className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-800 font-medium border border-gray-200 px-3 py-1.5 rounded-lg">
                                <Mail className="w-3 h-3" /> Send Credentials
                            </button>
                        </div>
                    </div>

                    {loadingStudents ? <div className="text-center py-8">Loading students...</div> : (
                        <div className="space-y-3">
                            {batchStudents.map(student => (
                                <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${student.role === 'CR' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                {student.name}
                                                {student.role === 'CR' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">CR</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">ID: {student.studentIdNo || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {student.role === 'CR' ? (
                                        <button onClick={() => handleCRAction(student.id, 'REVOKE')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Revoke CR Status">
                                            <ShieldOff className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => handleCRAction(student.id, 'PROMOTE')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Promote to CR">
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {batchStudents.length === 0 && <p className="text-center text-gray-400 py-8">No students found in this batch.</p>}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Student Modal */}
            <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Add Student Manually">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
                            value={studentData.name} onChange={e => setStudentData({ ...studentData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
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
                            value={studentData.studentIdNo} onChange={e => setStudentData({ ...studentData, studentIdNo: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsAddStudentOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add Student</button>
                    </div>
                </form>
            </Modal>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure you want to proceed?"}
                onConfirm={confirmAction?.onConfirm || (() => { })}
                isDanger={confirmAction?.isDanger}
                confirmText={confirmAction?.confirmText}
            />
        </div >
    );
}
