"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Mail, Phone, Briefcase, Trash2, Edit, Ban, CheckCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

export default function FacultyPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const deptId = session?.user?.departmentId;

    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Data
    const [editTarget, setEditTarget] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        designation: "Lecturer",
        phone: ""
    });

    useEffect(() => {
        if (deptId) fetchFaculty();
    }, [deptId]);

    async function fetchFaculty() {
        try {
            const res = await fetch(`/api/dept/faculty?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setFaculty(data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const endpoint = editTarget ? "/api/dept/faculty" : "/api/dept/faculty";
            const method = editTarget ? "PUT" : "POST";
            const body = editTarget
                ? { ...formData, id: editTarget.id, departmentId: deptId, action: 'UPDATE_PROFILE' }
                : { ...formData, departmentId: deptId };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success(editTarget ? "Profile updated" : "Faculty added");
                setIsAddOpen(false);
                setIsEditOpen(false);
                setEditTarget(null);
                setFormData({ name: "", email: "", password: "", designation: "Lecturer", phone: "" });
                fetchFaculty();
            } else {
                toast.error("Operation failed");
            }
        } catch (e) { toast.error("An error occurred"); }
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleToggleBan(teacher: any) {
        const isBanning = !teacher.isBanned;
        setConfirmAction({
            title: isBanning ? "Deactivate Teacher" : "Activate Teacher",
            message: isBanning
                ? "Are you sure you want to deactivate this account? They will lose access."
                : "Are you sure you want to reactivate this account?",
            isDanger: isBanning,
            confirmText: isBanning ? "Deactivate" : "Activate",
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/dept/faculty", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: teacher.id,
                            departmentId: deptId,
                            action: 'TOGGLE_BAN',
                            isBanned: isBanning
                        }),
                    });
                    if (res.ok) {
                        toast.success("Status updated");
                        fetchFaculty();
                    } else {
                        toast.error("Operation failed");
                    }
                } catch (e) { toast.error("An error occurred"); }
                finally {
                    setConfirmAction(null); // Close the confirmation modal
                }
            }
        });
    }

    function openEdit(teacher: any) {
        setEditTarget(teacher);
        setFormData({
            name: teacher.name,
            email: teacher.email,
            password: "", // Password not editable directly here for security simplicity
            designation: teacher.designation || "Lecturer",
            phone: teacher.phone || ""
        });
        setIsEditOpen(true);
    }

    const filtered = faculty.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase())
    );

    if (!deptId) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Faculty Management</h1>
                    <p className="text-gray-500">Manage teachers and professors.</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setFormData({ name: "", email: "", password: "", designation: "Lecturer", phone: "" }); setIsAddOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Add Faculty
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading faculty...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(teacher => (
                        <div key={teacher.id} className={`bg-white p-6 rounded-xl shadow-sm border ${teacher.isBanned ? 'border-red-200 bg-red-50/10' : 'border-gray-100'} hover:shadow-md transition-shadow group relative overflow-hidden`}>
                            {teacher.isBanned && <div className="absolute top-0 right-0 bg-red-100 text-red-600 px-3 py-1 rounded-bl-lg text-xs font-bold uppercase">Deactivated</div>}

                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${teacher.isBanned ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600'}`}>
                                        {teacher.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{teacher.name}</h3>
                                        <p className="text-sm text-indigo-600 font-medium">{teacher.designation || "Lecturer"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(teacher)} className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> {teacher.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> {teacher.phone || "No contact info"}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teacher.isBanned ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {teacher.isBanned ? 'Inactive' : 'Active'}
                                </span>
                                <button onClick={() => handleToggleBan(teacher)} className={`text-xs font-medium hover:underline ${teacher.isBanned ? 'text-green-600' : 'text-red-500'}`}>
                                    {teacher.isBanned ? 'Activate' : 'Deactivate'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                            No faculty members found.
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }} title={editTarget ? "Edit Faculty Profile" : "Add New Faculty"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    {!editTarget && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required minLength={6}
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                                <option>Lecturer</option>
                                <option>Assistant Professor</option>
                                <option>Associate Professor</option>
                                <option>Professor</option>
                                <option>Head of Department</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            {editTarget ? "Update Profile" : "Create Profile"}
                        </button>
                    </div>
                </form>
            </Modal>

        {/* Confirmation Modal */ }
        < ConfirmationModal
    isOpen = {!!confirmAction
}
onClose = {() => setConfirmAction(null)}
title = { confirmAction?.title || "Confirm Action"}
message = { confirmAction?.message || "Are you sure?"}
onConfirm = { confirmAction?.onConfirm || (() => { })}
isDanger = { confirmAction?.isDanger }
confirmText = { confirmAction?.confirmText }
    />
        </div >
    );
}
