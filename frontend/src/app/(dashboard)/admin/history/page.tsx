"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Activity, Search, Filter, ChevronLeft, ChevronRight, Clock, User, Shield } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function HistoryPage() {
    const { data: session } = useSession();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

    useEffect(() => {
        // @ts-ignore
        if (session?.user?.departmentId) {
            // @ts-ignore
            fetchLogs(session.user.departmentId, pagination.page);
        }
    }, [session, pagination.page]);

    async function fetchLogs(deptId: string, page: number) {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/logs?departmentId=${deptId}&page=${page}&limit=${pagination.limit}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-[1600px] mt-8 mx-auto p-6 space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-3 text-gray-300">
                            <Shield className="w-3 h-3 mr-2 text-indigo-400" />
                            Audit Log
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System History</h1>
                        <p className="text-gray-400 max-w-xl">
                            Track all administrative actions and system events.
                        </p>
                    </div>
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                {loading && logs.length === 0 ? (
                    <LoadingSpinner />
                ) : logs.length > 0 ? (
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performed By</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-gray-900">
                                                    {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{log.actorName}</p>
                                                    <p className="text-xs text-gray-500">{log.actorEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.details ? (
                                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                                    {log.details}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-900">No logs found</p>
                        <p className="text-sm mt-1">Activity logs will appear here once actions are performed.</p>
                    </div>
                )}

                {/* Pagination */}
                {logs.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing page <span className="font-bold">{pagination.page}</span> of <span className="font-bold">{pagination.totalPages}</span> ({pagination.total} total)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
