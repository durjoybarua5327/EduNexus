import { auth } from "@/auth";
import { getStudentProfile } from "@/lib/api";
import { getFolderContents } from "@/lib/actions/files";
import { ProfileView } from "@/components/ProfileView";

export default async function ProfilePage(props: { searchParams: Promise<{ folderId?: string; userId?: string; user?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const user = session?.user;

    if (!user) return <div className="p-8 text-center text-red-500 font-semibold">Please log in to view your profile.</div>;

    const queryUserId = searchParams?.userId || searchParams?.user;
    const profile = await getStudentProfile(queryUserId || undefined);

    if (!profile) {
        return <div className="p-8 text-center text-slate-500 font-semibold">Student profile not found.</div>;
    }

    const folderId = searchParams?.folderId || null;
    const { folders, files, breadcrumbs } = await getFolderContents(folderId, queryUserId || user.id);

    return (
        <ProfileView
            profile={profile}
            currentUser={user}
            cloudData={{ folders, files, breadcrumbs, folderId }}
            basePath={`/student/profile${queryUserId ? `?userId=${queryUserId}` : ''}`}
        />
    );
}

function Badge({ children, color }: { children: React.ReactNode, color: string }) {
    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${color} transition-transform hover:scale-105 cursor-default`}>
            {children}
        </span>
    );
}
