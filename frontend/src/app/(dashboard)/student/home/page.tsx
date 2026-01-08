
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
            {/* Colorful & Premium Header */}
            <div className="relative mb-8">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Department <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Feed</span>
                        </h1>
                    </div>
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
