"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/user-context";
import { Plus, Search, Mail, Phone, Briefcase, Trash2, Edit, Ban, CheckCircle, GraduationCap, Loader2, Eye, EyeOff, Wand2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";

import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function FacultyPage() {
    const { data: session } = useSession();
    const { user } = useUser();
    // @ts-ignore
    const deptId = user?.departmentId || (session?.user as any)?.departmentId;

    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setFormData(prev => ({ ...prev, password: retVal }));
        setShowPassword(true);
    };

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

    async function handleDelete(teacher: any) {
        setConfirmAction({
            title: "Delete Faculty Member",
            message: `Are you sure you want to permanently delete current ${teacher.name}? This action cannot be undone.`,
            isDanger: true,
            confirmText: "Delete Forever",
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/dept/faculty", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: teacher.id, departmentId: deptId }),
                    });
                    if (res.ok) {
                        toast.success("Faculty deleted");
                        fetchFaculty();
                    } else {
                        toast.error("Delete failed");
                    }
                } catch (e) { toast.error("An error occurred"); }
                finally { setConfirmAction(null); }
            }
        });
    }

    const filtered = faculty.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase())
    );

    // if (!deptId) return null;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 max-w-[1600px] mx-auto">

            {/* Header Section */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                        <span className="text-slate-900">Faculty</span> <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Management</span>
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 font-medium">
                        Manage teaching staff <span className="mx-2 text-slate-300">•</span> {faculty.length} Members
                    </p>
                </div>

                <button
                    onClick={() => { setEditTarget(null); setFormData({ name: "", email: "", password: "", designation: "Lecturer", phone: "" }); setIsAddOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all duration-300 font-bold hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Add Faculty
                </button>
            </div>


            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto md:mx-0">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search faculty by name or email..."
                    className="block w-full pl-11 pr-4 py-3 border-0 rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-shadow hover:ring-gray-300"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(teacher => (
                        <div key={teacher.id} className={`bg-white rounded-[2rem] p-7 border transition-all duration-300 will-change-transform group hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 ${teacher.isBanned ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:border-violet-100 shadow-xl shadow-slate-200/50'}`}>
                            {teacher.isBanned && (
                                <div className="mb-4 bg-red-50 text-red-700 px-3 py-1 rounded-lg text-xs font-bold uppercase inline-flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> Deactivated Account
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner ${teacher.isBanned ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'}`}>
                                        {teacher.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-violet-700 transition-colors">{teacher.name}</h3>
                                        <p className="text-sm text-violet-500 font-medium mb-0.5">{teacher.designation || "Lecturer"}</p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(teacher)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit Profile">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(teacher)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Account">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{teacher.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{teacher.phone || "No contact info"}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${teacher.isBanned ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></div>
                                    <span className={`text-xs font-medium ${teacher.isBanned ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {teacher.isBanned ? 'Access Revoked' : 'Active Status'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleToggleBan(teacher)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${teacher.isBanned ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                >
                                    {teacher.isBanned ? 'Reactivate' : 'Deactivate'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No faculty found</h3>
                            <p className="text-slate-500 mt-1">Try adjusting your search terms or add a new faculty member.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isAddOpen || isEditOpen} onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }} title={editTarget ? "Edit Faculty Profile" : "Add New Faculty"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300 font-medium" required
                            placeholder="e.g. Dr. John Doe"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300 font-medium" required
                            placeholder="john.doe@university.edu"
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700">Password {editTarget && <span className="text-slate-400 font-normal ml-1">(Optional)</span>}</label>
                            <button type="button" onClick={generatePassword} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                                <Wand2 className="w-3 h-3" /> Generate
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                                required={!editTarget}
                                minLength={6}
                                placeholder={editTarget ? "Leave blank to keep current" : "Set a secure password"}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                            <select className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-white font-medium"
                                value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                                <option>Lecturer</option>
                                <option>Assistant Professor</option>
                                <option>Associate Professor</option>
                                <option>Professor</option>
                                <option>Head of Department</option>
                                <option>Adjunct Faculty</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input type="tel" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                                placeholder="+880..."
                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-50">
                        <button type="button" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="px-5 py-2.5 text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-violet-200 font-bold transition-all hover:-translate-y-0.5">
                            {editTarget ? "Save Changes" : "Create Profile"}
                        </button>
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
