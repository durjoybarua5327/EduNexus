
import { auth } from "@/auth";
import { getStudentProfile, fetchAPI } from "@/lib/api";
import { Bell, LayoutDashboard, Sparkles, Zap } from "lucide-react";
import { NoticeFeed } from "@/components/NoticeFeed";

async function getNotices(departmentId: string) {
    if (!departmentId) return [];
    return await fetchAPI(`/dept/notices?departmentId=${departmentId}`) || [];
}

export default async function HomePage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500 font-semibold">Please log in to view this page.</div>;

    const profile = await getStudentProfile();

    if (!profile || !profile.departmentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-6 bg-amber-50 rounded-full border-4 border-amber-100 shadow-xl">
                    <LayoutDashboard className="w-16 h-16 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Setup Pending</h1>
                    <p className="text-lg text-gray-500 max-w-md mx-auto">
                        You have not been assigned to a Department yet. Please contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    const notices = await getNotices(profile.departmentId);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Minimalist Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100/80">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold uppercase tracking-widest text-xs">
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Live Updates</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 tracking-tight">
                        Department Feed
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900">Batch {profile?.batchName || "N/A"}</span>
                    </div>
                    <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
                    <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-gray-200 hover:shadow-xl hover:scale-105 transition-all cursor-default">
                        <Sparkles className="w-4 h-4 text-yellow-300 fill-current" />
                        {notices.length} Priority Posts
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {notices.length > 0 ? (
                    <NoticeFeed notices={notices} />
                ) : (
                    <div className="py-32 text-center bg-gradient-to-b from-gray-50/50 to-white rounded-[2.5rem] border border-dashed border-gray-200">
                        <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-gray-100 border border-gray-50">
                            <Bell className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">There are no new notices at this time.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
