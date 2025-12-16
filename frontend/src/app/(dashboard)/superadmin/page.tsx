'use client';

import { useEffect, useState } from "react";
import { Building, Users, AlertTriangle, ShieldAlert, Activity } from "lucide-react";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));
    }, []);

    if (!stats) return <div className="p-6">Loading Dashboard...</div>;

    return (
        <div className="p-6 space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, Super Admin! 👋</h1>
                    <p className="text-blue-100 opacity-90">Manage your entire academic ecosystem from one central hub.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 opacity-20 rounded-full -ml-10 -mb-10 blur-xl"></div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <SummaryCard
                    title="Total Universities"
                    value={stats.universities}
                    icon={Building}
                    color="bg-blue-500"
                />
                <SummaryCard
                    title="Total Departments"
                    value={stats.departments}
                    icon={Building} // Or Network icon if imported
                    color="bg-indigo-500"
                />
                <SummaryCard
                    title="Total Dept Admins"
                    value={stats.totalDeptAdmins || 0}
                    icon={ShieldAlert} // Using ShieldAlert temporarily or import generic Shield
                    color="bg-purple-500"
                />
                <SummaryCard
                    title="Total Users"
                    value={stats.users}
                    icon={Users}
                    color="bg-green-500"
                />
                <SummaryCard
                    title="Active Bans"
                    value={stats.activeBans}
                    icon={AlertTriangle}
                    color="bg-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                            Recent Activity
                        </h2>
                        <span className="text-xs text-gray-500">Last 10 actions</span>
                    </div>
                    <div className="space-y-4">
                        {stats.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((log: any) => (
                                <div key={log.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                        <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()} - {log.details}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No recent activity logs found.</p>
                        )}
                    </div>
                </div>

                {/* Alerts / Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                            System Status
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
                            <strong>System Healthy:</strong> Database connection is stable.
                        </div>
                        {stats.activeBans > 0 && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                                <strong>Attention:</strong> There are {stats.activeBans} active bans in the system requiring review.
                            </div>
                        )}
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600">
                            <strong>Admin Count:</strong> {stats.admins} active administrators managing the platform.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`p-4 rounded-full ${color} bg-opacity-10 mr-4`}>
                <Icon className={`w-8 h-8 ${color.replace("bg-", "text-")}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}
