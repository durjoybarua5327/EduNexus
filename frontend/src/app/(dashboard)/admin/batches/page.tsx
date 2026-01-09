"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/user-context";
import { Plus, Layers, Users, Trash2, Calendar, Eye, Shield, ShieldOff, Mail, Edit3, MoreVertical, GraduationCap, Star } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

import { LoadingSpinner } from "@/components/LoadingSpinner";
// import { FixedSizeList } from "react-window"; 
// Virtualization temporarily disabled due to build/runtime issues

export default function BatchesPage() {
    const { data: session } = useSession();
    const { user } = useUser();
    // @ts-ignore
    const deptId = user?.departmentId || (session?.user as any)?.departmentId;

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
        currentSemester: "1st",
        semesterDuration: 6
    });

    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [studentData, setStudentData] = useState({
        name: "",
        email: "",
        password: "changeme123", // Default recommendation
        studentIdNo: ""
    });
    const [isEditStudentMode, setIsEditStudentMode] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    async function handleStudentSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (isEditStudentMode && editingStudentId) {
                // Update Logic
                const res = await fetch("/api/dept/students", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        studentId: editingStudentId,
                        action: 'UPDATE_INFO',
                        departmentId: deptId,
                        name: studentData.name,
                        password: studentData.password === "changeme123" ? "" : studentData.password, // Only send if changed from default/placeholder
                        studentIdNo: studentData.studentIdNo
                    }),
                });

                if (res.ok) {
                    toast.success("Student updated successfully");
                    setIsAddStudentOpen(false);
                    setStudentData({ name: "", email: "", password: "changeme123", studentIdNo: "" });
                    setIsEditStudentMode(false);
                    setEditingStudentId(null);
                    // Refresh student list
                    const listRes = await fetch(`/api/dept/students?batchId=${selectedBatch.id}`);
                    if (listRes.ok) setBatchStudents(await listRes.json());
                } else {
                    toast.error("Failed to update student");
                }
            } else {
                // Create Logic (Assign CR)
                const res = await fetch("/api/dept/students", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...studentData, batchId: selectedBatch.id, departmentId: deptId, role: 'CR' }),
                });
                if (res.ok) {
                    toast.success("CR Assigned Successfully");
                    setIsAddStudentOpen(false);
                    setStudentData({ name: "", email: "", password: "changeme123", studentIdNo: "" });
                    // Refresh student list
                    const listRes = await fetch(`/api/dept/students?batchId=${selectedBatch.id}`);
                    if (listRes.ok) setBatchStudents(await listRes.json());
                } else {
                    toast.error("Failed to assign CR");
                }
            }
        } catch (e) { toast.error("Error submitting student form"); }
    }

    function openEditStudent(student: any) {
        setStudentData({
            name: student.name,
            email: student.email,
            password: "", // Leave empty to indicate no change unless typed
            studentIdNo: student.studentIdNo || ""
        });
        setEditingStudentId(student.id);
        setIsEditStudentMode(true);
        setIsAddStudentOpen(true);
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

    async function handleToggleTopCR(studentId: string, currentIsTopCR: boolean) {
        // Count current Top CRs
        const topCRCount = batchStudents.filter(s => s.role === 'CR' && s.isTopCR).length;

        if (!currentIsTopCR && topCRCount >= 2) {
            toast.error("Maximum 2 Top CRs allowed per batch");
            return;
        }

        setConfirmAction({
            title: currentIsTopCR ? "Remove Top CR Status" : "Assign Top CR",
            message: currentIsTopCR
                ? "This CR will become a normal CR with limited permissions."
                : "This CR will become a Top CR with expanded management permissions.",
            confirmText: currentIsTopCR ? "Remove" : "Assign",
            isDanger: currentIsTopCR,
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/dept/students", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            studentId,
                            action: 'TOGGLE_TOP_CR',
                            isTopCR: !currentIsTopCR,
                            departmentId: deptId
                        }),
                    });

                    if (res.ok) {
                        toast.success(currentIsTopCR ? "Top CR status removed" : "Top CR assigned");
                        // Refresh student list
                        const listRes = await fetch(`/api/dept/students?batchId=${selectedBatch.id}`);
                        if (listRes.ok) setBatchStudents(await listRes.json());
                    } else {
                        const data = await res.json();
                        toast.error(data.error || "Failed to update Top CR status");
                    }
                } catch (e) { toast.error("Error updating Top CR"); }
            }
        });
    }


    async function handlePromote(batch: any) {
        setConfirmAction({
            title: "Promote Batch",
            message: `Are you sure you want to promote ${batch.name} to the next semester? This will update their current semester and reset the promotion timer.`,
            confirmText: "Promote Batch",
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/dept/batches", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: batch.id, action: 'PROMOTE', name: batch.name }), // Name needed for log
                    });
                    if (res.ok) {
                        toast.success("Batch promoted successfully");
                        fetchBatches();
                    } else {
                        toast.error("Failed to promote batch");
                    }
                } catch (e) { toast.error("Error promoting batch"); }
            }
        });
    }

    // ... existing imports ...

    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    function handleEdit(batch: any) {
        setEditingBatch(batch);
        setFormData({
            name: batch.name,
            year: batch.year,
            section: batch.section || "A",
            startMonth: batch.startMonth || "January",
            currentSemester: batch.currentSemester || "1st",
            semesterDuration: parseInt(batch.semesterDuration) || 6
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
                setFormData({ name: "", year: new Date().getFullYear(), section: "A", startMonth: "January", currentSemester: "1st", semesterDuration: 6 });
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

    // if (!deptId) return null;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-indigo-50/50 to-white/80 p-6 rounded-3xl border border-white/50 shadow-sm backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                        <Layers className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Batch Management</h1>
                        <p className="text-gray-500 font-medium mt-1">Organize students into batches and assign representatives.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="relative z-10 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 font-semibold"
                >
                    <Plus className="w-5 h-5" /> Create Batch
                </button>

                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>


            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map(batch => (
                        <div key={batch.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 group hover:shadow-xl hover:-translate-y-1 transition-transform transition-shadow duration-300 will-change-transform relative overflow-hidden">
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700 opacity-50"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(batch)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit Batch">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(batch.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Batch">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{batch.name}</h3>

                                <div className="flex flex-wrap gap-2 mt-3 mb-6">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {batch.year}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100">
                                        Sec {batch.section || "A"}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                        {batch.currentSemester} Sem
                                    </span>
                                </div>

                                <div className="mt-auto pt-5 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Reps</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{batch.crs?.length || 0}</span>
                                    </div>
                                    <div className="flex -space-x-3 mb-5 pl-1">
                                        {batch.crs && batch.crs.length > 0 ? batch.crs.map((cr: any) => (
                                            <div key={cr.id} className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm" title={cr.name}>
                                                {cr.name[0]}
                                            </div>
                                        )) : (
                                            <span className="text-xs text-gray-400 italic pl-2">No CRs assigned</span>
                                        )}
                                    </div>

                                    <button onClick={() => handleViewStudents(batch)} className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-sm font-semibold transition-all border border-transparent hover:border-indigo-100 mb-2">
                                        <Users className="w-4 h-4" /> Manage Students
                                    </button>

                                    {/* Promotion Logic Display */}
                                    {(() => {
                                        if (batch.currentSemester === "Completed" || batch.semesterDuration === "Continuous") return null;

                                        const durationMonths = parseInt(batch.semesterDuration) || 6;

                                        const lastPromo = batch.lastPromotionDate ? new Date(batch.lastPromotionDate) : new Date(batch.createdAt);
                                        const nextPromoDate = new Date(lastPromo);
                                        nextPromoDate.setMonth(nextPromoDate.getMonth() + durationMonths);

                                        const isDue = new Date() >= nextPromoDate;
                                        const daysOverdue = Math.floor((new Date().getTime() - nextPromoDate.getTime()) / (1000 * 3600 * 24));

                                        return (
                                            <button
                                                onClick={() => handlePromote(batch)}
                                                disabled={!isDue}
                                                className={`w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all border shadow-sm
                                            ${isDue
                                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent hover:shadow-lg hover:scale-[1.02] animate-pulse cursor-pointer"
                                                        : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-70"
                                                    }`}
                                            >
                                                <GraduationCap className="w-4 h-4" />
                                                {isDue ? `Promote Now (${daysOverdue} days overdue)` : `Promote in ${Math.abs(daysOverdue)} days`}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))}
                    {batches.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layers className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No batches here</h3>
                            <p className="text-gray-500 mt-1">Start by creating your first batch.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Batch Modal */}
            <Modal isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setIsEditMode(false); setEditingBatch(null); }} title={isEditMode ? "Edit Batch" : "Create New Batch"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
                            required placeholder="e.g. CSE-25"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <input type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                required min="2000" max="2100"
                                value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="A"
                                value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
                            <select
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none max-h-40 overflow-y-auto bg-white"
                                value={formData.startMonth}
                                onChange={e => setFormData({ ...formData, startMonth: e.target.value })}
                                size={5}>
                                <option value="January">January</option>
                                <option value="February">February</option>
                                <option value="March">March</option>
                                <option value="April">April</option>
                                <option value="May">May</option>
                                <option value="June">June</option>
                                <option value="July">July</option>
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
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none max-h-40 overflow-y-auto bg-white"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester Duration</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="e.g. 6"
                            min="1"
                            max="60"
                            value={formData.semesterDuration}
                            onChange={e => setFormData({ ...formData, semesterDuration: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter the duration in months (e.g. 6). Determines when the system suggests promoting the batch.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                        <button type="button" onClick={() => { setIsAddOpen(false); setIsEditMode(false); setEditingBatch(null); }} className="px-5 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                            {isEditMode ? "Update Batch" : "Create Batch"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Students List Modal */}
            <Modal isOpen={isViewStudentsOpen} onClose={() => setIsViewStudentsOpen(false)} title={`Students: ${selectedBatch?.name || ''}`} maxWidth="max-w-4xl">
                <div className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <p className="text-sm font-semibold text-gray-700">{batchStudents.length} Students Enrolled</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsEditStudentMode(false); setStudentData({ name: "", email: "", password: "changeme123", studentIdNo: "" }); setIsAddStudentOpen(true); }} className="text-xs flex items-center gap-1.5 text-indigo-700 hover:text-white font-bold bg-white hover:bg-indigo-600 px-4 py-2 rounded-lg border border-indigo-100 transition-all shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Assign CR
                            </button>
                        </div>
                    </div>

                    {loadingStudents ? <div className="text-center py-12 text-gray-400">Loading student roster...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {batchStudents.map(student => (
                                <div key={student.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${student.role === 'CR' && student.isTopCR
                                            ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white'
                                            : student.role === 'CR'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'
                                            }`}>
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                {student.name}
                                                {student.role === 'CR' && student.isTopCR && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2 py-0.5 rounded font-bold">
                                                        <Star className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" /> TOP CR
                                                    </span>
                                                )}
                                                {student.role === 'CR' && !student.isTopCR && (
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200">CR</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {student.studentIdNo || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Top CR Toggle (only for CRs) */}
                                        {student.role === 'CR' && (
                                            <button
                                                onClick={() => handleToggleTopCR(student.id, student.isTopCR)}
                                                className={`p-2 rounded-lg transition-colors ${student.isTopCR
                                                    ? 'text-purple-600 hover:bg-purple-50'
                                                    : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                                                    }`}
                                                title={student.isTopCR ? "Remove Top CR" : "Make Top CR"}
                                            >
                                                <Star className={`w-4 h-4 ${student.isTopCR ? 'fill-purple-600' : ''}`} />
                                            </button>
                                        )}

                                        {/* Revoke CR / Promote to CR */}
                                        {student.role === 'CR' ? (
                                            <button onClick={() => handleCRAction(student.id, 'REVOKE')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Revoke CR Status">
                                                <ShieldOff className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button onClick={() => handleCRAction(student.id, 'PROMOTE')} className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Promote to CR">
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Edit Button */}
                                        <button onClick={() => openEditStudent(student)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Student">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {batchStudents.length === 0 && <p className="col-span-full text-center text-gray-400 py-12 italic border border-dashed border-gray-200 rounded-xl bg-gray-50">No students found in this batch.</p>}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add/Edit Student Modal */}
            <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)}
                title={isEditStudentMode ? "Update Student Details" : "Assign Class Representative"}>
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                    {!isEditStudentMode && (
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                            You are assigning a Class Representative (CR). CRs will be responsible for adding other students to this batch.
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300" required
                            placeholder="Student Name"
                            value={studentData.name} onChange={e => setStudentData({ ...studentData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300" required={!isEditStudentMode}
                            placeholder="student@example.com"
                            disabled={isEditStudentMode} // Email usually immutable or needs special handling
                            value={studentData.email} onChange={e => setStudentData({ ...studentData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditStudentMode && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}</label>
                        <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300" required={!isEditStudentMode} minLength={6}
                            placeholder={isEditStudentMode ? "New Password (Optional)" : "Password"}
                            value={studentData.password} onChange={e => setStudentData({ ...studentData, password: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID No</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="e.g. 2021001"
                            value={studentData.studentIdNo} onChange={e => setStudentData({ ...studentData, studentIdNo: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                        <button type="button" onClick={() => setIsAddStudentOpen(false)} className="px-5 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                            {isEditStudentMode ? "Update Student" : "Assign CR"}
                        </button>
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
        </div>
    );
}

