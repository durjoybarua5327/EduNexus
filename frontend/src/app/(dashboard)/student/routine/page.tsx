
import { auth } from "@/auth";
import { getStudentProfile, fetchAPI } from "@/lib/api";
import { CalendarRange, Clock, Zap } from "lucide-react";
import { RoutineList } from "@/components/RoutineList";

async function getRoutines(departmentId: string, batchId: string) {
    if (!departmentId) return [];
    // Fetch routines filtering by batchId if backend supports it (we added it)
    return await fetchAPI(`/dept/routines?departmentId=${departmentId}&batchId=${batchId}`) || [];
}

export default async function RoutinePage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500">Please log in to view this page.</div>;

    const profile = await getStudentProfile();

    if (!profile || !profile.departmentId || !profile.batchId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-6 bg-emerald-50 rounded-full border-4 border-emerald-100">
                    <CalendarRange className="w-16 h-16 text-emerald-500" />
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

    const routines = await getRoutines(profile.departmentId, profile.batchId);

    // Filter for CLASS routines vs EXAM routines
    const classRoutines = routines.filter((r: any) => r.type === 'CLASS');
    const examRoutines = routines.filter((r: any) => r.type === 'EXAM');

    return (
        <div className="max-w-[1600px] mx-auto space-y-12">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-100">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Schedule
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
                {/* Class Routines */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Class Routine</h2>
                        <div className="h-px bg-emerald-100 flex-1" />
                    </div>
                    <RoutineList routines={classRoutines} type="CLASS" />
                </div>

                {/* Exam Routines */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Exam Schedule</h2>
                        <div className="h-px bg-rose-100 flex-1" />
                    </div>
                    <RoutineList routines={examRoutines} type="EXAM" />
                </div>
            </div>
        </div>
    );
}
