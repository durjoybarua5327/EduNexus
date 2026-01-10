
import { auth } from "@/auth";
import { getStudentProfile, fetchAPI } from "@/lib/api";
import { LayoutDashboard } from "lucide-react";
import { BatchPageWrapper } from "../../../../components/BatchPageWrapper";

async function getBatchmates(batchId: string) {
    if (!batchId) return [];
    return await fetchAPI(`/dept/students?batchId=${batchId}`) || [];
}

async function getUserIsTopCR(userId: string) {
    // Fetch fresh isTopCR status from database
    const userData = await fetchAPI(`/user/check-topcr?userId=${userId}`);
    return userData?.isTopCR === 1 || userData?.isTopCR === true;
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

    // Fetch fresh isTopCR status from database (not from cached session)
    const isTopCR = await getUserIsTopCR(user.id);

    // Sort: Teachers, then CRs, then Students
    students.sort((a: any, b: any) => {
        if (a.role === 'TEACHER') return -1;
        if (b.role === 'TEACHER') return 1;
        if (a.role === 'CR' && b.role !== 'CR') return -1;
        if (a.role !== 'CR' && b.role === 'CR') return 1;
        return a.name.localeCompare(b.name);
    });

    return <BatchPageWrapper students={students} profile={profile} userId={user.id} isTopCR={isTopCR} />;
}
