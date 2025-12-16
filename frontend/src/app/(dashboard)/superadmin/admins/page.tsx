'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { UserPlus, Shield, Ban, CheckCircle, Search, Filter, X, Eye, EyeOff, Edit3, Trash2 } from "lucide-react";

function AdminsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const departmentIdParam = searchParams.get("departmentId");

    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState(departmentIdParam || "");
    const [uniFilter, setUniFilter] = useState("");

    // Ban Modal
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banData, setBanData] = useState({ id: "", duration: 0 });

    // Add User Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [addData, setAddData] = useState({
        name: "",
        email: "",
        password: "",
        role: "DEPT_ADMIN",
        departmentId: departmentIdParam || ""
    });

    // Edit User Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        id: "",
        name: "",
        email: "",
        role: "",
        departmentId: ""
    });

    useEffect(() => {
        if (departmentIdParam) {
            setDeptFilter(departmentIdParam);
            setAddData(prev => ({ ...prev, departmentId: departmentIdParam }));

            // Auto open Add Modal if action=add
            if (searchParams.get("action") === "add") {
                setIsAddModalOpen(true);
            }
        }
    }, [departmentIdParam, searchParams]);

    useEffect(() => {
        fetchDepartments();
        fetchUniversities();
        fetchUsers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, roleFilter, deptFilter, uniFilter]);

    async function fetchDepartments() {
        try {
            const res = await fetch("/api/admin/departments");
            const data = await res.json();
            setDepartments(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load departments");
        }
    }

    async function fetchUniversities() {
        try {
            const res = await fetch("/api/admin/universities");
            const data = await res.json();
            setUniversities(data);
        } catch (e) { console.error(e); }
    }

    async function fetchUsers() {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (search) query.append("search", search);
            if (roleFilter) query.append("role", roleFilter);
            if (deptFilter) query.append("departmentId", deptFilter);
            if (uniFilter) query.append("universityId", uniFilter);

            const res = await fetch(`/api/admin/users?${query.toString()}`);
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        if (!addData.name || !addData.email || !addData.password || !addData.role) {
            return toast.error("Please fill in all required fields");
        }
        if (addData.role === 'DEPT_ADMIN' && !addData.departmentId) {
            return toast.error("Department Admin must be assigned to a department");
        }

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addData),
            });

            if (res.ok) {
                toast.success("User added successfully");
                setIsAddModalOpen(false);
                setAddData({ name: "", email: "", password: "", role: "DEPT_ADMIN", departmentId: deptFilter || "" });
                fetchUsers();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add user");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        }
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
                fetchUsers();
            } else {
                toast.error("Failed to update user");
            }
        } catch (e) { console.error(e); toast.error("An error occurred"); }
    }

    function openEditModal(user: any) {
        setEditData({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId || ""
        });
        setIsEditModalOpen(true);
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

    async function updateUser(id: string, updates: any) {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...updates }),
            });
            if (res.ok) fetchUsers();
            else toast.error("Failed to update user");
        } catch (e) { console.error(e); }
    }

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    async function handleTopAdminAction(userId: string, departmentId: string, action: 'promote' | 'demote') {
        try {
            if (action === 'promote') {
                const res = await fetch("/api/admin/assign-top-admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, departmentId }),
                });
                if (res.ok) {
                    toast.success("Promoted to Top Admin");
                    fetchUsers();
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
                    fetchUsers();
                } else {
                    toast.error("Failed to remove status");
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        }
    }

    function requestTopAdminAction(userId: string, departmentId: string, action: 'promote' | 'demote') {
        if (!departmentId) return toast.error("User must belong to a department first.");

        setConfirmModal({
            isOpen: true,
            title: action === 'promote' ? "Promote to Top Admin?" : "Remove Top Admin Status?",
            message: action === 'promote'
                ? "This user will become the main representative for their department. Any existing Top Admin will be demoted."
                : "This user will revert to a regular Department Admin.",
            isDanger: action === 'demote',
            onConfirm: () => handleTopAdminAction(userId, departmentId, action),
        });
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                isDanger={confirmModal.isDanger}
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage admins and departmental staff.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        placeholder="Search by name, email, dept or university..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className="border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none max-w-xs"
                    value={uniFilter}
                    onChange={e => setUniFilter(e.target.value)}
                >
                    <option value="">All Universities</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>

                <select
                    className="border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="DEPT_ADMIN">Dept Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                </select>

                <select
                    className="border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none max-w-xs"
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                {(search || roleFilter || deptFilter || uniFilter) && (
                    <button
                        onClick={() => { setSearch(""); setRoleFilter(""); setDeptFilter(""); setUniFilter(""); }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                        Clear
                    </button>
                )}
            </div>

            {
                isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role / Dept / Uni</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>}
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => openEditModal(user)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3 group-hover:bg-indigo-200 transition-colors">
                                                    {user.name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    user.role === 'DEPT_ADMIN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        user.role === 'TEACHER' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                            'bg-gray-100 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                                {user.isTopDepartmentAdmin && (
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                                                        <Shield className="w-3 h-3" /> Top Admin
                                                    </span>
                                                )}
                                                {user.departmentName && <span className="text-xs text-gray-600 font-medium">{user.departmentName}</span>}
                                                {user.universityName && <span className="text-xs text-gray-400">{user.universityName}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isBanned ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    <Ban className="w-3 h-3 mr-1" /> Banned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit User">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {user.role !== 'SUPER_ADMIN' && (
                                                <>
                                                    <button
                                                        onClick={() => toggleBan(user.id, user.isBanned)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${user.isBanned
                                                            ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                                                            : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        {user.isBanned ? "Unban" : "Ban"}
                                                    </button>
                                                    {user.departmentId && user.role !== 'SUPER_ADMIN' && !user.isBanned && (
                                                        user.isTopDepartmentAdmin ? (
                                                            <button
                                                                onClick={() => requestTopAdminAction(user.id, user.departmentId, 'demote')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                                                title="Remove Top Admin Status"
                                                            >
                                                                Demote
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => requestTopAdminAction(user.id, user.departmentId, 'promote')}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                                title="Promote to Top Admin"
                                                            >
                                                                Top Admin
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }

            {/* Ban Modal */}
            {
                isBanModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4 text-gray-900">Ban User</h2>
                                <form onSubmit={handleBanSubmit}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                            value={banData.duration}
                                            onChange={e => setBanData({ ...banData, duration: parseInt(e.target.value) })}
                                            min="-1"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use -1 for permanent ban.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsBanModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all">Ban User</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add User Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Add Dept Admin</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleAddUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                placeholder="John Doe"
                                                value={addData.name}
                                                onChange={e => setAddData({ ...addData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                placeholder="john@example.com"
                                                value={addData.email}
                                                onChange={e => setAddData({ ...addData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2 relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10"
                                                    placeholder="••••••••"
                                                    value={addData.password}
                                                    onChange={e => setAddData({ ...addData, password: e.target.value })}
                                                    required
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={addData.role}
                                                onChange={e => setAddData({ ...addData, role: e.target.value })}
                                                required
                                            >
                                                <option value="DEPT_ADMIN">Dept Admin</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={addData.departmentId}
                                                onChange={e => setAddData({ ...addData, departmentId: e.target.value })}
                                                disabled={addData.role === 'SUPER_ADMIN'}
                                                required={addData.role !== 'SUPER_ADMIN'}
                                            >
                                                <option value="">Select Dept</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all">Create User</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleEditUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={editData.name}
                                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus://ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={editData.email}
                                                onChange={e => setEditData({ ...editData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={editData.role}
                                                onChange={e => setEditData({ ...editData, role: e.target.value })}
                                                required
                                            >
                                                <option value="DEPT_ADMIN">Dept Admin</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                value={editData.departmentId}
                                                onChange={e => setEditData({ ...editData, departmentId: e.target.value })}
                                                disabled={editData.role === 'SUPER_ADMIN'}
                                            >
                                                <option value="">Select Dept</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">Save Changes</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminsContent />
        </Suspense>
    );
}
