import { getAdminStats } from "@/lib/actions/admin";
import { Users, GraduationCap, School, BookOpen } from "lucide-react";

export default async function AdminOverviewPage() {
    // In a real app we might handle errors or loading states
    const stats = await getAdminStats();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Department Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Students" value={stats.students} icon={Users} color="text-blue-600" bg="bg-blue-100" />
                <StatCard title="Total Faculty" value={stats.teachers} icon={GraduationCap} color="text-green-600" bg="bg-green-100" />
                <StatCard title="Active Batches" value={stats.batches} icon={School} color="text-orange-600" bg="bg-orange-100" />
                <StatCard title="Total Courses" value={stats.courses} icon={BookOpen} color="text-purple-600" bg="bg-purple-100" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
                        Chart / Activity Log Placeholder
                    </div>
                </div>
                <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between group">
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600">Add New User</span>
                            <span className="text-gray-400 group-hover:text-indigo-600">→</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between group">
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600">Create Batch</span>
                            <span className="text-gray-400 group-hover:text-indigo-600">→</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between group">
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600">Post Notice</span>
                            <span className="text-gray-400 group-hover:text-indigo-600">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-full ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
            </div>
        </div>
    );
}
