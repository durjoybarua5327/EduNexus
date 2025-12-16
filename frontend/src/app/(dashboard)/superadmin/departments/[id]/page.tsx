"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    Building2, Users, GraduationCap, School,
    MoreVertical, Settings, Trash2, ArrowLeft,
    Edit2, Plus, Mail, Shield, Search, Eye, EyeOff, CheckCircle, Ban
} from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Modal } from "@/components/Modal";

export default function DepartmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();

    const [department, setDepartment] = useState<any>(null);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameName, setRenameName] = useState("");

    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [addAdminData, setAddAdminData] = useState({ name: "", email: "", password: "" });

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => { }, isDanger: false
    });

    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banData, setBanData] = useState({ id: "", duration: 7 });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ id: "", name: "", email: "", role: "DEPT_ADMIN", departmentId: "" });

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);
            // Fetch Department
            const deptRes = await fetch(`/api/admin/departments?id=${id}`);
            const deptData = await deptRes.json();
            if (deptData && deptData.length > 0) {
                setDepartment(deptData[0]);
                setRenameName(deptData[0].name);
            } else {
                toast.error("Department not found");
                router.push("/superadmin/departments");
                return;
            }

            // Fetch Admins
            const adminsRes = await fetch(`/api/admin/users?departmentId=${id}&role=DEPT_ADMIN`);
            const adminsData = await adminsRes.json();
            setAdmins(adminsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load department details");
        } finally {
            setLoading(false);
        }
    }

    // --- Actions ---

    async function handleRename(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/departments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name: renameName }),
            });
            if (res.ok) {
                toast.success("Department renamed");
                setIsRenameOpen(false);
                fetchData();
            } else {
                toast.error("Failed to rename");
            }
        } catch (error) { toast.error("Error renaming department"); }
    }

    async function handleDeleteDept() {
        try {
            const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Department deleted");
                router.push("/superadmin/departments");
            } else {
                toast.error("Failed to delete department");
            }
        } catch (error) { toast.error("Error deleting department"); }
    }

    async function handleAddAdmin(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...addAdminData, role: "DEPT_ADMIN", departmentId: id }),
            });
            if (res.ok) {
                toast.success("Admin added successfully");
                setIsAddAdminOpen(false);
                setAddAdminData({ name: "", email: "", password: "" });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add admin");
            }
        } catch (error) { toast.error("Error creating admin"); }
    }

    // deleted handle delete admin placeholder

    async function handleTopAdminAction(userId: string, action: 'promote' | 'demote') {
        try {
            if (action === 'promote') {
                const res = await fetch("/api/admin/assign-top-admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, departmentId: id }),
                });
                if (res.ok) {
                    toast.success("Promoted to Top Admin");
                    fetchData();
                } else {
                    const err = await res.json();
                    toast.error(err.error || "Failed to promote");
                }
            } else {
                // Demote
                const res = await fetch("/api/admin/users", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: userId, isTopDepartmentAdmin: false }),
                });
                if (res.ok) {
                    toast.success("Removed Top Admin status");
                    fetchData();
                } else {
                    toast.error("Failed to remove status");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        }
    }

    async function updateUser(userId: string, updates: any) {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, ...updates }),
            });
            if (res.ok) fetchData();
            else toast.error("Failed to update user");
        } catch (e) { console.error(e); }
    }

    async function toggleBan(userId: string, isBanned: boolean) {
        if (isBanned) {
            if (!confirm("Unban this user?")) return;
            await updateUser(userId, { isBanned: false });
            toast.success("User unbanned");
        } else {
            setBanData({ id: userId, duration: 7 });
            setIsBanModalOpen(true);
        }
    }

    async function handleBanSubmit(e: React.FormEvent) {
        e.preventDefault();
        await updateUser(banData.id, { isBanned: true, banDuration: banData.duration });
        setIsBanModalOpen(false);
        toast.success("User banned");
    }

    async function handleEditUser(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (res.ok) {
                toast.success("User updated successfully");
                setIsEditModalOpen(false);
                fetchData();
            } else {
                toast.error("Failed to update user");
            }
        } catch (e) { console.error(e); toast.error("An error occurred"); }
    }

    function openEditModal(admin: any) {
        setEditData({
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            departmentId: admin.departmentId || ""
        });
        setIsEditModalOpen(true);
    }

    function requestTopAdminAction(userId: string, action: 'promote' | 'demote') {
        setConfirmModal({
            isOpen: true,
            title: action === 'promote' ? "Promote to Top Admin?" : "Remove Top Admin Status?",
            message: action === 'promote'
                ? "This user will become the main representative for this department. Any existing Top Admin will be demoted."
                : "This user will revert to a regular Department Admin.",
            isDanger: action === 'demote',
            onConfirm: () => handleTopAdminAction(userId, action),
        });
    }

    // Dropdown state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading department details...</div>;

    if (!department) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-xl m-8">
                <div className="text-red-500 mb-2">Department not found or failed to load.</div>
                <div className="text-sm text-gray-500 mb-4">ID: {id}</div>
                <button
                    onClick={() => router.push("/superadmin/departments")}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Back to Departments
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300" onClick={() => setOpenMenuId(null)}>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                isDanger={confirmModal.isDanger}
            />

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Departments
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Building2 className="w-10 h-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{department.name}</h1>
                            <button
                                onClick={() => setIsRenameOpen(true)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-gray-500 font-medium">
                            <School className="w-4 h-4" />
                            {department.universityName}
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <Users className="w-3 h-3" /> {admins.length} Admins
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                <GraduationCap className="w-3 h-3" /> {department.studentCount || 0} Students
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setConfirmModal({
                            isOpen: true,
                            title: "Delete Department?",
                            message: "Are you sure? This action cannot be undone and will delete all associated data.",
                            isDanger: true,
                            onConfirm: handleDeleteDept
                        })}
                        className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Department
                    </button>
                </div>
            </div>

            {/* Admins Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" /> Department Admins
                    </h2>
                    <button
                        onClick={() => setIsAddAdminOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-medium"
                    >
                        <Plus className="w-5 h-5" /> Add Admin
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
                    {admins.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium">No Admins Yet</h3>
                            <p className="text-gray-500 text-sm mt-1">Add an admin to manage this department</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {admins.map((admin) => (
                                <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                            {admin.name?.[0] || "A"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">{admin.name}</h4>
                                                {admin.isTopDepartmentAdmin && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                        <Shield className="w-3 h-3" /> TOP ADMIN
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Mail className="w-3 h-3 mr-1" /> {admin.email}
                                            </div>
                                            <div className="mt-2">
                                                {admin.isBanned ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        <Ban className="w-3 h-3 mr-1" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {admin.isTopDepartmentAdmin ? (
                                            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                                                TOP DEPT ADMIN
                                            </span>
                                        ) : (
                                            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                DEPT ADMIN
                                            </span>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(admin); }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleBan(admin.id, admin.isBanned); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${admin.isBanned
                                                ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                                                : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                                }`}
                                        >
                                            {admin.isBanned ? "Unban" : "Ban"}
                                        </button>

                                        {admin.isTopDepartmentAdmin ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); requestTopAdminAction(admin.id, 'demote'); }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                            >
                                                Demote
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); requestTopAdminAction(admin.id, 'promote'); }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                                            >
                                                Top Admin
                                            </button>
                                        )}
                                    </div>        </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Rename Modal */}
            <Modal isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)} title="Rename Department">
                <form onSubmit={handleRename} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                            required
                            type="text"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsRenameOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save</button>
                    </div>
                </form>
            </Modal>

            {/* Add Admin Modal */}
            <Modal isOpen={isAddAdminOpen} onClose={() => setIsAddAdminOpen(false)} title="Add Department Admin">
                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            required
                            type="text"
                            value={addAdminData.name}
                            onChange={(e) => setAddAdminData({ ...addAdminData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            value={addAdminData.email}
                            onChange={(e) => setAddAdminData({ ...addAdminData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={addAdminData.password}
                                onChange={(e) => setAddAdminData({ ...addAdminData, password: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-indigo-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="pt-2 text-sm text-gray-500">
                        This user will be assigned as <strong>Department Admin</strong> for <strong>{department.name}</strong>.
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsAddAdminOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-200">Add Admin</button>
                    </div>
                </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User">
                <form onSubmit={handleEditUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            value={editData.name}
                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            value={editData.email}
                            onChange={e => setEditData({ ...editData, email: e.target.value })}
                            required
                        />
                    </div>
                    {/* Role is implicit/fixed in this context */}

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Changes</button>
                    </div>
                </form>
            </Modal>
        </div>
    );

}
