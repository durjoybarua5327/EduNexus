import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;

    if (role === 'STUDENT') redirect("/dashboard/semester");
    if (role === 'TEACHER') redirect("/teacher/courses");
    if (role === 'DEPT_ADMIN') redirect("/admin/overview");
    if (role === 'SUPER_ADMIN') redirect("/superadmin");

    // Fallback
    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Redirect Failed</h1>
                <p className="text-gray-700 mb-2">Welcome, <span className="font-semibold">{session.user.name}</span></p>
                <p className="text-gray-700">Your role is: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{role || 'UNDEFINED'}</span></p>
                <p className="mt-4 text-sm text-gray-500">Please contact support or try logging out.</p>
                <form action={async () => { 'use server'; await import('@/auth').then(m => m.signOut()); }}>
                    <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Sign Out</button>
                </form>
            </div>
        </div>
    );
}
