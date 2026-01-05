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
    const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');

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

        // Validate batch selection
        if (selectedBatches.length === 0) {
            toast.error("Please select at least one batch");
            return;
        }

        try {
            let fileUrl = routineForm.url;

            // If a file is selected, upload it first
            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!uploadRes.ok) {
                    const error = await uploadRes.json();
                    toast.error(error.error || 'Failed to upload file');
                    return;
                }

                const uploadData = await uploadRes.json();
                fileUrl = uploadData.url;
            }

            const type = activeTab === 'EXAMS' ? 'EXAM' : 'CLASS';

            // @ts-ignore
            const userId = session?.user?.id;

            const res = await fetch("/api/dept/routines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...routineForm,
                    batchId: selectedBatches.join(','), // Send as comma-separated string
                    departmentId: deptId, // Added for ALL case
                    actorId: userId, // Added for Audit Logging
                    url: fileUrl,
                    type: type
                }),
            });
            if (res.ok) {
                const successMsg = activeTab === 'EXAMS' ? 'Exam Schedule' : 'Routine';
                toast.success(`${successMsg} uploaded successfully`);
                setIsRoutineModalOpen(false);
                setRoutineForm({ batchId: "", type: "CLASS", content: "", url: "" });
                setSelectedBatches([]);
                setSelectedFile(null);
                fetchRoutines(type);
            } else toast.error("Failed to upload");
        } catch (e) {
            console.error(e);
            toast.error("Error uploading file");
        }
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

    function handleViewDocument(url: string) {
        // For regular URLs (new uploads), open directly
        if (!url.startsWith('data:')) {
            window.open(url, '_blank');
            return;
        }

        // For legacy base64 data, convert to blob and open
        try {
            const base64Data = url.split(',')[1];
            const mimeType = url.split(';')[0].split(':')[1];

            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            const newWindow = window.open(blobUrl, '_blank');

            if (!newWindow) {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `document.${mimeType.includes('pdf') ? 'pdf' : 'file'}`;
                link.click();
            }

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error('Error opening document:', error);
            toast.error('Failed to open document');
        }
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

                            {routine.content && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                                    {routine.content}
                                </div>
                            )}

                            {routine.url && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {/* File Preview */}
                                    {(routine.url.startsWith('data:image') || routine.url.includes('/uploads/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(routine.url) || /\.(jpg|jpeg|png|gif|webp)$/i.test(routine.url)) ? (
                                        <img
                                            src={routine.url}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover rounded border border-gray-300"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-white rounded border border-gray-300 flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {routine.url.includes('/uploads/') ? 'Uploaded File' :
                                                routine.url.startsWith('data:') ? 'Uploaded File' :
                                                    'Document Link'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {routine.url.startsWith('data:image') || (routine.url.includes('/uploads/') && /\.(jpg|jpeg|png|gif|webp)$/i.test(routine.url)) || /\.(jpg|jpeg|png|gif|webp)$/i.test(routine.url) ? 'Image' :
                                                routine.url.startsWith('data:application/pdf') || routine.url.includes('.pdf') ? 'PDF Document' :
                                                    'External Link'}
                                        </p>
                                    </div>

                                    {/* View Button */}
                                    <button
                                        onClick={() => handleViewDocument(routine.url)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                                    >
                                        View Document
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {routines.length === 0 && <EmptyState message={`No ${activeTab === 'ROUTINES' ? 'class routines' : 'exam schedules'} found.`} />}
                </div>
            )}

            {/* Routine/Exam Modal */}
            <Modal isOpen={isRoutineModalOpen} onClose={() => setIsRoutineModalOpen(false)} title={`Upload ${activeTab === 'EXAMS' ? 'Exam Schedule' : 'Routine'}`}>
                <form onSubmit={handleRoutineSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Batch(es)
                            {selectedBatches.length > 0 && (
                                <span className="ml-2 text-xs text-indigo-600 font-semibold">
                                    ({selectedBatches.includes('ALL') ? 'All Batches' : `${selectedBatches.length} selected`})
                                </span>
                            )}
                        </label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                            {/* Select All Option */}
                            <label className="flex items-center cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedBatches.includes('ALL')}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedBatches(['ALL']);
                                        } else {
                                            setSelectedBatches([]);
                                        }
                                    }}
                                    className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                                />
                                <span className="font-semibold text-indigo-700">All Batches</span>
                            </label>

                            <div className="border-t border-gray-200 my-2"></div>

                            {/* Individual Batch Options */}
                            {batches.map(batch => (
                                <label key={batch.id} className="flex items-center cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedBatches.includes(batch.id) || selectedBatches.includes('ALL')}
                                        disabled={selectedBatches.includes('ALL')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedBatches([...selectedBatches.filter(id => id !== 'ALL'), batch.id]);
                                            } else {
                                                setSelectedBatches(selectedBatches.filter(id => id !== batch.id));
                                            }
                                        }}
                                        className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-700">{batch.name} ({batch.year})</span>
                                </label>
                            ))}

                            {batches.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">No batches available</p>
                            )}
                        </div>
                    </div>

                    {/* Upload Method Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="uploadMethod"
                                    value="file"
                                    checked={uploadMethod === 'file'}
                                    onChange={() => {
                                        setUploadMethod('file');
                                        setRoutineForm({ ...routineForm, url: "" });
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Upload File</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="uploadMethod"
                                    value="link"
                                    checked={uploadMethod === 'link'}
                                    onChange={() => {
                                        setUploadMethod('link');
                                        setSelectedFile(null);
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Provide Link</span>
                            </label>
                        </div>
                    </div>

                    {/* Conditional Input Based on Upload Method */}
                    {uploadMethod === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (Image or PDF)</label>
                            <input
                                key="file-input"
                                type="file"
                                accept="image/*,.pdf"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                        setRoutineForm({ ...routineForm, url: "" });
                                    }
                                }}
                            />
                            {selectedFile && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Link/URL</label>
                            <input
                                type="url"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://example.com/document.pdf"
                                value={routineForm.url}
                                onChange={e => setRoutineForm({ ...routineForm, url: e.target.value })}
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter a link to Google Drive, Dropbox, or any publicly accessible document</p>
                        </div>
                    )}

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
