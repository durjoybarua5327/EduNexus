
import { auth } from "@/auth";
import { getStudentProfile, fetchAPI } from "@/lib/api";
import { LayoutDashboard, Search, Users } from "lucide-react";
import { BatchGrid } from "@/components/BatchGrid";

async function getBatchmates(batchId: string) {
    if (!batchId) return [];
    return await fetchAPI(`/dept/students?batchId=${batchId}`) || [];
}

export default async function BatchPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500">Please log in to view this page.</div>;

    const profile = await getStudentProfile();

    if (!profile || !profile.batchId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-6 bg-indigo-50 rounded-full border-4 border-indigo-100">
                    <LayoutDashboard className="w-16 h-16 text-indigo-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Setup Pending</h1>
                    <p className="text-lg text-gray-500 max-w-md mx-auto">
                        You have not been assigned to a Batch yet.
                    </p>
                </div>
            </div>
        );
    }

    const students = await getBatchmates(profile.batchId);

    // Sort: Teachers, then CRs, then Students
    students.sort((a: any, b: any) => {
        if (a.role === 'TEACHER') return -1;
        if (b.role === 'TEACHER') return 1;
        if (a.role === 'CR' && b.role !== 'CR') return -1;
        if (a.role !== 'CR' && b.role === 'CR') return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="max-w-[1600px] mx-auto space-y-12">

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-indigo-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-xs">
                        <Users className="w-4 h-4" />
                        <span>Student Directory</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        {profile.batchName}
                    </h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="search"
                            placeholder="Find a classmate..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium placeholder:text-gray-400"
                        />
                    </div>
                    <div className="hidden md:flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 font-bold text-xl">
                        {students.length}
                    </div>
                </div>
            </div>

            <BatchGrid students={students} />
        </div>
    );
}
