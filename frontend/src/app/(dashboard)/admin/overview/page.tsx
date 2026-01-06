"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, GraduationCap, BookOpen, Clock, Activity, Calendar, Bell, Layers, TrendingUp, ChevronRight, MoreHorizontal } from "lucide-react";
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
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full border-b-2 border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-500 text-xs tracking-widest">LOADING</div>
                </div>
            </div>
        );
    }

    // @ts-ignore
    if (!session?.user?.departmentId) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 text-center max-w-lg mx-4">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Activity className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">No Department Assigned</h2>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                        You are logged in as a Department Admin, but no department is currently linked to your account.
                    </p>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        Contact Super Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-10 text-white shadow-2xl shadow-indigo-200">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium mb-3">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                            System Operational
                        </div>
                        <h1 className="text-4xl font-bold mb-3 tracking-tight">
                            Welcome Back, <span className="text-indigo-200">{session?.user?.name?.split(' ')[0]}</span>! 👋
                        </h1>
                        <p className="text-indigo-100 text-lg max-w-xl leading-relaxed opacity-90">
                            Here's what's happening in your department today. You have pending tasks in curriculum management.
                        </p>
                    </div>
                </div>

                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full blur-3xl opacity-30 mix-blend-overlay animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-full blur-3xl opacity-30 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Faculty Members"
                    value={stats?.faculty || 0}
                    icon={GraduationCap}
                    color="text-purple-600"
                    bgColor="bg-purple-500/10"
                    trend="+12% from last month"
                    delay="delay-0"
                />
                <StatsCard
                    title="Total Students"
                    value={stats?.students || 0}
                    icon={Users}
                    color="text-blue-600"
                    bgColor="bg-blue-500/10"
                    trend="+5% new enrollments"
                    delay="delay-100"
                />
                <StatsCard
                    title="Active Batches"
                    value={stats?.batches || 0}
                    icon={Layers}
                    color="text-orange-600"
                    bgColor="bg-orange-500/10"
                    trend="Operating normally"
                    delay="delay-200"
                />
                <StatsCard
                    title="Active Courses"
                    value={stats?.courses || 0}
                    icon={BookOpen}
                    color="text-pink-600"
                    bgColor="bg-pink-500/10"
                    trend="2 courses expiring soon"
                    delay="delay-300"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                Recent Activity
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Latest updates from your department</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map((log: any, i: number) => (
                                <div key={log.id} className="relative pl-6 sm:pl-8 group">
                                    {/* Timeline line */}
                                    {i !== stats.recentActivity.length - 1 && (
                                        <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-gray-100 group-hover:bg-indigo-100 transition-colors"></div>
                                    )}

                                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-white rounded-2xl border border-gray-50 hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                by <span className="font-medium text-indigo-600">{log.actorName}</span>
                                            </p>
                                            {log.details && (
                                                <p className="text-xs text-gray-400 mt-2 bg-gray-50 inline-block px-2 py-1 rounded-md border border-gray-100">
                                                    {log.details}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 px-4 rounded-2xl bg-gray-50/50 border border-gray-100 border-dashed">
                                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <p className="text-gray-500 font-medium">No recent activity detected.</p>
                                <p className="text-sm text-gray-400 mt-1">Actions performed by admins will appear here.</p>
                            </div>
                        )}

                        {stats?.recentActivity?.length > 0 && (
                            <div className="text-center pt-4">
                                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center">
                                    View All History <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Shortcuts */}
                <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-6 sm:p-8 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-purple-500" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <QuickActionCard
                                href="/admin/academics"
                                title="Class Routines"
                                desc="Manage Schedules"
                                icon={BookOpen}
                                color="indigo"
                            />
                            <QuickActionCard
                                href="/admin/academics"
                                title="Exam Schedules"
                                desc="Set Dates & Time"
                                icon={Calendar}
                                color="purple"
                            />
                            <QuickActionCard
                                href="/admin/notices"
                                title="Post Notice"
                                desc="Announcements"
                                icon={Bell}
                                color="blue"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

function StatsCard({ title, value, icon: Icon, color, bgColor, trend, delay }: any) {
    return (
        <div className={`bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 hover:shadow-2xl hover:shadow-indigo-200/40 transition-all duration-500 transform hover:-translate-y-1 hover:border-indigo-100 group animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${bgColor} ${color} transition-transform group-hover:scale-110 duration-500`}>
                    <Icon className="w-7 h-7" />
                </div>
                {trend && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {trend.includes('course') || trend.includes('batches') ? 'Active' : '+4.5%'}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

function QuickActionCard({ href, title, desc, icon: Icon, color }: any) {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
        purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    };

    // @ts-ignore
    const bgClass = colorClasses[color] || colorClasses.indigo;

    return (
        <Link href={href} className="group flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300">
            <div className={`p-3 rounded-xl transition-all duration-300 mr-4 ${bgClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                <p className="text-xs text-gray-500 font-medium">{desc}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
        </Link>
    );
}
