"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Shield, Trash2, Crown } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function DeptAdminsPage() {
    const { data: session } = useSession();
    // @ts-ignore
    const { departmentId, isTopDepartmentAdmin } = session?.user || {};

    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    useEffect(() => {
        if (departmentId) fetchAdmins();
    }, [departmentId]);

    async function fetchAdmins() {
        try {
            const res = await fetch(`/api/dept/admins?departmentId=${departmentId}`);
            if (res.ok) setAdmins(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastSubmitTime < 5000) {
            toast.error(`Please wait ${Math.ceil((5000 - (now - lastSubmitTime)) / 1000)}s before adding another admin.`);
            return;
        }

        try {
            const res = await fetch("/api/dept/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, departmentId }),
            });
            if (res.ok) {
                setLastSubmitTime(Date.now());
                toast.success("Admin added");
                setIsAddOpen(false);
                setFormData({ name: "", email: "", password: "" });
                fetchAdmins();
            } else {
                toast.error("Failed to add admin");
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

    async function handleDelete(id: string) {
        setConfirmAction({
            title: "Remove Admin",
            message: "Are you sure you want to remove this admin? They will lose access to the department panel.",
            isDanger: true,
            confirmText: "Remove",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/admins?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Admin removed");
                        fetchAdmins();
                    }
                } catch (e) { console.error(e); }
            }
        });
    }

    if (!departmentId) return null;

    if (!isTopDepartmentAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <Shield className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
                <p className="text-gray-500 mt-2">Only the Top Department Admin can manage other admins.</p>
            </div>
        );
    }

    return (
        <div className="p-6 mt-8 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-white to-emerald-50/50 p-6 rounded-3xl border border-white/50 shadow-sm backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-200 text-white">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Department Admins</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage access for your department.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="relative z-10 flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 font-semibold"
                >
                    <Plus className="w-5 h-5" /> Add Admin
                </button>

                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map(admin => (
                        <div key={admin.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group transition-transform transition-shadow duration-300 will-change-transform hover:-translate-y-1 hover:shadow-lg">
                            {admin.isTopDepartmentAdmin && (
                                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> TOP ADMIN
                                </div>
                            )}

                            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                                <span className="text-2xl font-bold">{admin.name[0]}</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{admin.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{admin.email}</p>

                            {!admin.isTopDepartmentAdmin && (
                                <button onClick={() => handleDelete(admin.id)}
                                    className="mt-auto flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium">
                                    <Trash2 className="w-4 h-4" /> Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Department Admin">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required minLength={6}
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Add Admin</button>
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
