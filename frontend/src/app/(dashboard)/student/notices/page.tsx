
import { auth } from "@/auth";
import { getStudentProfile, fetchAPI } from "@/lib/api";
import { Bell, Calendar, LayoutDashboard, Megaphone, Pin, Tag as TagIcon } from "lucide-react";

async function getNotices(departmentId: string) {
    if (!departmentId) return [];
    return await fetchAPI(`/dept/notices?departmentId=${departmentId}`) || [];
}

export default async function NoticesPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500">Please log in to view this page.</div>;

    const profile = await getStudentProfile();

    if (!profile || !profile.departmentId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="p-4 bg-yellow-50 rounded-full">
                    <LayoutDashboard className="w-12 h-12 text-yellow-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Setup Pending</h1>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        You have not been assigned to a Department yet. Please contact support.
                    </p>
                </div>
            </div>
        );
    }

    const notices = await getNotices(profile.departmentId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Department Notices</h1>
                <p className="text-lg text-gray-500 mt-2">Latest updates, news, and announcements.</p>
            </div>

            <div className="space-y-4">
                {notices.length > 0 ? (
                    notices.map((notice: any) => (
                        <div key={notice.id} className={`group relative p-6 bg-white rounded-2xl border ${notice.isPinned ? 'border-indigo-200 shadow-indigo-100 shadow-lg' : 'border-gray-100 shadow-sm'} hover:shadow-md transition-all duration-300 overflow-hidden`}>
                            {/* Pinned Indicator */}
                            {notice.isPinned && (
                                <div className="absolute top-0 right-0 p-3 bg-indigo-50 rounded-bl-2xl">
                                    <Pin className="w-4 h-4 text-indigo-600 fill-current rotate-45" />
                                </div>
                            )}

                            <div className="flex items-start gap-5">
                                <div className={`p-4 rounded-xl ${notice.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} shrink-0`}>
                                    {notice.priority === 'HIGH' ? <Megaphone className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {notice.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </div>
                                            {notice.expiryDate && (
                                                <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md text-xs font-medium">
                                                    Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        {notice.description}
                                    </div>

                                    {/* Tags */}
                                    {notice.tags && notice.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {notice.tags.map((tag: string) => (
                                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                                    <TagIcon className="w-3 h-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No notices yet</h3>
                        <p className="text-gray-500 mt-1">Check back later for important updates.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
