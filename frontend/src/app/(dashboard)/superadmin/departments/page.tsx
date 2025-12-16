'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Building2, Users, GraduationCap, School, MoreVertical, Settings, Trash2, ArrowLeftRight, Edit3, X } from "lucide-react";

// Wrap in Suspense for useSearchParams
function DepartmentsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const universityId = searchParams.get("universityId");

    const [departments, setDepartments] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]); // For filter
    const [isLoading, setIsLoading] = useState(true);

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createData, setCreateData] = useState({ name: "" });

    // Rename Modal State
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameData, setRenameData] = useState({ id: "", name: "" });

    // Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    useEffect(() => {
        fetchUniversities();
        fetchDepartments();

        // Close menu on click outside
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [universityId]);

    async function fetchUniversities() {
        try {
            const res = await fetch("/api/admin/universities");
            const data = await res.json();
            setUniversities(data);
        } catch (e) { console.error(e); }
    }

    async function fetchDepartments() {
        setIsLoading(true);
        try {
            const endpoint = universityId
                ? `/api/admin/departments?universityId=${universityId}`
                : `/api/admin/departments`;

            const res = await fetch(endpoint);
            const data = await res.json();
            if (Array.isArray(data)) {
                setDepartments(data);
            } else {
                console.error("Invalid departments data:", data);
                setDepartments([]);
                if (data.error) toast.error(data.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load departments");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!universityId) return toast.error("No university selected");

        try {
            const res = await fetch("/api/admin/departments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...createData, universityId }),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                setCreateData({ name: "" });
                fetchDepartments();
                toast.success("Department created successfully");
            } else {
                toast.error("Failed to create department");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    }

    async function handleRename(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/departments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(renameData),
            });
            if (res.ok) {
                setIsRenameOpen(false);
                fetchDepartments();
                toast.success("Department renamed successfully");
            } else {
                toast.error("Failed to rename department");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    }

    function requestDelete(id: string) {
        setConfirmModal({
            isOpen: true,
            title: "Delete Department?",
            message: "Are you sure? This will remove the department permanently. This action cannot be undone.",
            isDanger: true,
            onConfirm: () => handleDelete(id),
        });
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchDepartments();
                toast.success("Department deleted successfully");
            } else {
                toast.error("Failed to delete department");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
                confirmText={confirmModal.confirmText}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <Building2 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Department Overview</h1>
                        <p className="text-gray-500 mt-1">Manage academic departments, faculty, and resources.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* University Filter */}
                    <div className="relative group">
                        <select
                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium hover:border-indigo-300 transition-all cursor-pointer min-w-[200px]"
                            value={universityId || ""}
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id) router.push(`/superadmin/departments?universityId=${id}`);
                                else router.push(`/superadmin/departments`);
                            }}
                        >
                            <option value="">All Universities</option>
                            {universities.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (!universityId) return toast.error("Please select a university to add a department.");
                            setIsCreateOpen(true);
                        }}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all font-medium flex items-center gap-2"
                    >
                        <span>Create Department</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 text-lg">No departments found matching your criteria.</p>
                        </div>
                    )}
                    {departments.map((dept) => (
                        <div
                            key={dept.id}
                            onClick={() => router.push(`/superadmin/departments/${dept.id}`)}
                            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all relative group cursor-pointer ${activeMenuId === dept.id ? 'z-20 ring-2 ring-indigo-500 shadow-lg' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{dept.name}</h3>
                                        {dept.isBanned ? (
                                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">BANNED</span>
                                        ) : (
                                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">ACTIVE</span>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === dept.id ? null : dept.id);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${activeMenuId === dept.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenuId === dept.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setRenameData({ id: dept.id, name: dept.name }); setIsRenameOpen(true); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit3 className="w-4 h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); requestDelete(dept.id); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"
                                            >
                                                <X className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admins</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{dept.adminCount || 0}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Students</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{dept.studentCount || 0}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faculty</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{dept.facultyCount || 0}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">78%</p> {/* Mock Data */}
                                </div>
                            </div>

                            <div className="flex justify-end items-center">
                                <button
                                    onClick={() => router.push(`/superadmin/admins?departmentId=${dept.id}`)}
                                    className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 hover:underline"
                                >
                                    Manage
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 text-gray-900">Add Department</h2>
                            <form onSubmit={handleCreate}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        placeholder="e.g. Computer Science"
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all">Create Department</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {isRenameOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-6 text-gray-900">Rename Department</h2>
                            <form onSubmit={handleRename}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Department Name"
                                        value={renameData.name}
                                        onChange={e => setRenameData({ ...renameData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsRenameOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DepartmentsContent />
        </Suspense>
    );
}
