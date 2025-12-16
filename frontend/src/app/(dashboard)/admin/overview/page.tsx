"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, GraduationCap, BookOpen, Clock, Activity, Calendar, Bell, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DepartmentAdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        if (session?.user?.id) {
            // @ts-ignore
            const deptId = session.user.departmentId;
            if (deptId) {
                fetchStats(deptId);
            } else {
                setLoading(false); // No dept assigned
            }
        }
    }, [session, status]);

    async function fetchStats(deptId: string) {
        try {
            const res = await fetch(`/api/dept/stats?departmentId=${deptId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading" || loading) {
        return <div className="p-8 text-center animate-pulse text-gray-500">Loading Dashboard...</div>;
    }

    // @ts-ignore
    if (!session?.user?.departmentId) {
        return (
            <div className="p-12 text-center">
                <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl border border-yellow-200 inline-block">
                    <h2 className="text-lg font-bold mb-2">No Department Assigned</h2>
                    <p>You are logged in as a Department Admin, but no department is linked to your account.</p>
                    <p className="mt-2 text-sm">Please contact the Super Admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome Back, Admin! 👋</h1>
                    <p className="text-teal-50 opacity-90">Here's what's happening in your department today.</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 opacity-20 rounded-full -ml-10 -mb-10 blur-xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Faculty Members"
                    value={stats?.faculty || 0}
                    icon={GraduationCap}
                    color="bg-purple-500"
                    sub="Active Teachers"
                />
                <StatsCard
                    title="Total Students"
                    value={stats?.students || 0}
                    icon={Users}
                    color="bg-blue-500"
                    sub="Across all batches"
                />
                <StatsCard
                    title="Active Batches"
                    value={stats?.batches || 0}
                    icon={Layers}
                    color="bg-orange-500"
                    sub="Current Sessions"
                />
                <StatsCard
                    title="Courses"
                    value={stats?.courses || 0}
                    icon={BookOpen}
                    color="bg-pink-500"
                    sub="Offered this term"
                />
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                        Recent Activity
                    </h2>
                </div>
                <div className="space-y-4">
                    {stats?.recentActivity?.length > 0 ? (
                        stats.recentActivity.map((log: any) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-2 border-transparent hover:border-indigo-500">
                                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()} by <span className="font-medium text-gray-700">{log.actorName}</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8 italic">No recent activity found.</p>
                    )}
                </div>
            </div>

            {/* Quick Actions / Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Link href="/admin/academics" className="p-6 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-indigo-500 text-white rounded-lg group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6" /></div>
                        <h3 className="font-bold text-indigo-900">Class Routines</h3>
                    </div>
                    <p className="text-sm text-indigo-700">Upload and manage class schedules.</p>
                </Link>

                <Link href="/admin/academics" className="p-6 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-purple-500 text-white rounded-lg group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6" /></div>
                        <h3 className="font-bold text-purple-900">Exam Schedules</h3>
                    </div>
                    <p className="text-sm text-purple-700">Set up exam dates and routines.</p>
                </Link>

                <Link href="/admin/notices" className="p-6 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform"><Bell className="w-6 h-6" /></div>
                        <h3 className="font-bold text-blue-900">Notices</h3>
                    </div>
                    <p className="text-sm text-blue-700">Post announcements.</p>
                </Link>
            </div>
        </div >
    );
}

function StatsCard({ title, value, icon: Icon, color, sub }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-transform hover:scale-[1.02]">
            <div className={`p-4 rounded-xl ${color} bg-opacity-10 mr-4 text-${color.split('-')[1]}-600`}>
                <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}
