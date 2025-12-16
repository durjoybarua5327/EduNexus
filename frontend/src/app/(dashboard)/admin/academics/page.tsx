"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, BookOpen, Trash2, Calendar, User, Clock, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

export default function AcademicsPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const deptId = session?.user?.departmentId;

    const [activeTab, setActiveTab] = useState<'ROUTINES' | 'EXAMS'>('ROUTINES');

    // Data States
    const [routines, setRoutines] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

    // Forms
    const [routineForm, setRoutineForm] = useState({ batchId: "", type: "CLASS", content: "", url: "" });

    useEffect(() => {
        if (deptId) {
            fetchInitialData();
        }
    }, [deptId]);

    // Fetch active tab data when tab changes
    useEffect(() => {
        if (deptId) {
            fetchRoutines(activeTab === 'EXAMS' ? 'EXAM' : 'CLASS');
        }
    }, [activeTab, deptId]);

    async function fetchInitialData() {
        setLoading(true);
        await Promise.all([fetchBatches(), fetchRoutines('CLASS')]);
        setLoading(false);
    }

    async function fetchRoutines(type: string) {
        try {
            const res = await fetch(`/api/dept/routines?departmentId=${deptId}&type=${type}`);
            if (res.ok) setRoutines(await res.json());
        } catch (e) { console.error(e); }
    }

    async function fetchBatches() {
        try {
            const res = await fetch(`/api/dept/batches?departmentId=${deptId}`);
            if (res.ok) setBatches(await res.json());
        } catch (e) { console.error(e); }
    }

    // --- Handlers ---

    async function handleRoutineSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/dept/routines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...routineForm, type: activeTab === 'EXAMS' ? 'EXAM' : 'CLASS' }),
            });
            if (res.ok) {
                toast.success(`${activeTab === 'EXAMS' ? 'Exam Schedule' : 'Routine'} uploaded`);
                setIsRoutineModalOpen(false);
                setRoutineForm({ batchId: "", type: "CLASS", content: "", url: "" });
                fetchRoutines(activeTab === 'EXAMS' ? 'EXAM' : 'CLASS');
            } else toast.error("Failed to upload");
        } catch (e) { toast.error("Error"); }
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleDelete(id: string) {
        const itemType = 'Routine/Exam Schedule';
        setConfirmAction({
            title: `Delete ${itemType}`,
            message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
            isDanger: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/routines?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Deleted successfully");
                        fetchRoutines(activeTab === 'EXAMS' ? 'EXAM' : 'CLASS');
                    } else {
                        toast.error("Failed to delete");
                    }
                } catch (e) { toast.error("Error deleting item"); }
            }
        });
    }

    if (!deptId) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Schedules & Routines</h1>
                    <p className="text-gray-500">Manage class routines and exam schedules.</p>
                </div>
                <button
                    onClick={() => setIsRoutineModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'ROUTINES' ? 'Upload Routine' : 'Add Exam Schedule'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('ROUTINES')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ROUTINES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Class Routines
                </button>
                <button onClick={() => setActiveTab('EXAMS')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'EXAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Exam Schedules
                </button>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {routines.map(routine => (
                        <div key={routine.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        {routine.batchName}
                                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {routine.batchYear} ({routine.batchSection})
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Uploaded {new Date(routine.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(routine.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {routine.url && (
                                <div className="relative aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                    {/* Placeholder for real image or link */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-8 h-8 opacity-50" />
                                        <span className="ml-2 text-sm">Image Preview</span>
                                    </div>
                                    <img src={routine.url} alt="Routine" className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity" />
                                </div>
                            )}

                            {routine.content && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                                    {routine.content}
                                </div>
                            )}

                            <div className="mt-auto pt-2">
                                <a href={routine.url} target="_blank" className="text-sm text-indigo-600 hover:underline font-medium">View Full Document →</a>
                            </div>
                        </div>
                    ))}
                    {routines.length === 0 && <EmptyState message={`No ${activeTab === 'ROUTINES' ? 'class routines' : 'exam schedules'} found.`} />}
                </div>
            )}

            {/* Routine/Exam Modal */}
            <Modal isOpen={isRoutineModalOpen} onClose={() => setIsRoutineModalOpen(false)} title={`Upload ${activeTab === 'EXAMS' ? 'Exam Schedule' : 'Routine'}`}>
                <form onSubmit={handleRoutineSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
                        <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required value={routineForm.batchId} onChange={e => setRoutineForm({ ...routineForm, batchId: e.target.value })}>
                            <option value="">Choose Batch</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.year})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (or File Link)</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="https://..."
                            value={routineForm.url} onChange={e => setRoutineForm({ ...routineForm, url: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes / Text Content</label>
                        <textarea className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                            placeholder="e.g. Room 304 changed to 305..."
                            value={routineForm.content} onChange={e => setRoutineForm({ ...routineForm, content: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsRoutineModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Upload</button>
                    </div>
                </form>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure?"}
                onConfirm={confirmAction?.onConfirm || (() => { })}
                isDanger={confirmAction?.isDanger}
                confirmText={confirmAction?.confirmText}
            />
        </div >
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            {message}
        </div>
    );
}
