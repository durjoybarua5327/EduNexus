'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Edit2, ExternalLink, School, MapPin, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Modal } from "@/components/Modal";

export default function UniversitiesPage() {
    const [universities, setUniversities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    const [formData, setFormData] = useState({ name: "", location: "" });
    const [editData, setEditData] = useState({ id: "", name: "", location: "", isBanned: false });

    const router = useRouter();

    useEffect(() => {
        fetchUniversities();
    }, []);

    async function fetchUniversities() {
        try {
            const res = await fetch("/api/admin/universities");
            const data = await res.json();
            setUniversities(data);
        } catch (error) {
            console.error("Failed to fetch universities", error);
            toast.error("Failed to fetch universities");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/universities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                setFormData({ name: "", location: "" });
                fetchUniversities();
                toast.success("University created successfully");
            } else {
                toast.error("Failed to create university");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/universities", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                setIsEditOpen(false);
                fetchUniversities();
                toast.success("University updated successfully");
            } else {
                toast.error("Failed to update university");
            }
        } catch (error) { console.error(error); toast.error("An error occurred"); }
    }

    function requestToggleBan(uni: any) {
        setConfirmModal({
            isOpen: true,
            title: uni.isBanned ? "Unban University?" : "Ban University?",
            message: `Are you sure you want to ${uni.isBanned ? 'UNBAN' : 'BAN'} ${uni.name}? This will affect all associated users access.`,
            isDanger: !uni.isBanned, // Banning is danger, unbanning is good
            onConfirm: () => toggleBan(uni),
        });
    }

    function requestDelete(id: string) {
        setConfirmModal({
            isOpen: true,
            title: "Delete University?",
            message: "Are you sure you want to delete this university? All associated departments AND users will be permanently deleted. This action cannot be undone.",
            isDanger: true,
            onConfirm: () => handleDelete(id),
        });
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/admin/universities?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchUniversities();
                toast.success("University deleted successfully");
            } else {
                toast.error("Failed to delete university");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    }

    async function toggleBan(uni: any) {
        try {
            const res = await fetch("/api/admin/universities", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: uni.id, isBanned: !uni.isBanned }),
            });
            if (res.ok) {
                fetchUniversities();
                toast.success(`University ${uni.isBanned ? 'unbanned' : 'banned'} successfully`);
            }
        } catch (error) { console.error(error); toast.error("Failed to update status"); }
    }



    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const filteredUniversities = universities.filter(uni =>
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (uni.location && uni.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Universities</h1>
                    <p className="text-gray-500 mt-1">Manage all registered universities and their campuses</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add University
                </button>
            </div>

            {/* Search and Filter */}
            <div className="sticky top-20 z-10 bg-gray-50/80 backdrop-blur-md py-4 -mx-4 px-4 mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search universities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-48 animate-pulse" />
                    ))}
                </div>
            ) : filteredUniversities.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No universities found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUniversities.map((uni) => (
                        <div
                            key={uni.id}
                            onClick={() => router.push(`/superadmin/departments?universityId=${uni.id}`)}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <School className="w-7 h-7" />
                                </div>
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === uni.id ? null : uni.id)}
                                        className={`p-2 rounded-lg transition-colors ${activeMenuId === uni.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {activeMenuId === uni.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setEditData({ id: uni.id, name: uni.name, location: uni.location, isBanned: uni.isBanned });
                                                    setIsEditOpen(true);
                                                    setActiveMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit Details
                                            </button>
                                            <button
                                                onClick={() => {
                                                    requestToggleBan(uni); // Replaced Delete with Ban/Unban or keep both? User usually wants delete.
                                                    setActiveMenuId(null);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${uni.isBanned ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                            >
                                                {uni.isBanned ? "Unban University" : "Ban University"}
                                            </button>
                                            <div className="h-px bg-gray-50 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    requestDelete(uni.id);
                                                    setActiveMenuId(null);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {uni.name}
                                </h3>
                                <div className="flex items-center text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {uni.location || "No location set"}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm">
                                        {(uni as any).deptCount || 0}
                                    </span>
                                    <span className="text-sm font-medium text-gray-600">Departments</span>
                                </div>
                                {uni.isBanned ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                        BANNED
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New University">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. Stanford University"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. California, USA"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all"
                        >
                            Create University
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit University">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                        <input
                            required
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={editData.location}
                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                        <input
                            type="checkbox"
                            id="isBanned"
                            checked={editData.isBanned}
                            onChange={(e) => setEditData({ ...editData, isBanned: e.target.checked })}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                        />
                        <label htmlFor="isBanned" className="text-sm font-medium text-red-800 cursor-pointer">
                            Ban this University (Restrict Access)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200 transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
