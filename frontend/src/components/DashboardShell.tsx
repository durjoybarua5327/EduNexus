"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { UserProvider } from "@/context/user-context";

import { Toaster } from "react-hot-toast";

export function DashboardShell({ children, user }: { children: React.ReactNode, user: any }) {

    // Define links based on role (Logic moved from Sidebar)
    const getLinks = (role?: string) => {
        switch (role) {
            case "STUDENT":
                return [
                    { name: "Home", href: "/student/home" },
                    { name: "Routine", href: "/student/routine" },
                    { name: "Batch", href: "/student/batch" },
                    { name: "Class Notice", href: "/student/class-notice" },
                    { name: "Resources", href: "/student/resources" },
                    { name: "Profile", href: "/student/profile" },
                ];
            case "CR":
                const crLinks = [
                    { name: "Home", href: "/student/home" },
                    { name: "Routine", href: "/student/routine" },
                    { name: "Batch", href: "/student/batch" },
                    { name: "Class Notice", href: "/student/class-notice" },
                    { name: "Resources", href: "/student/resources" },
                    { name: "Profile", href: "/student/profile" },
                ];
                // Add Manage CRs link if user is Top CR
                if (user?.isTopCR) {
                    crLinks.splice(3, 0, { name: "Manage CRs", href: "/student/manage-crs" });
                }
                return crLinks;
            case "TEACHER":
                return [
                    { name: "My Courses", href: "/teacher/courses" },
                    { name: "Uploads", href: "/teacher/uploads" },
                    { name: "Notices", href: "/teacher/notices" },
                    { name: "Profile", href: "/student/profile" },
                ];
            case "DEPT_ADMIN":
                const deptLinks = [
                    { name: "Dashboard", href: "/admin/overview" },
                    { name: "Batches", href: "/admin/batches" },
                    { name: "Teachers", href: "/admin/faculty" },
                    { name: "Courses", href: "/admin/courses" },
                    { name: "Academics", href: "/admin/academics" },
                    { name: "Notice", href: "/admin/notices" },
                ];
                // @ts-ignore
                if (user?.isTopDepartmentAdmin) {
                    deptLinks.push({ name: "Admin", href: "/admin/admins" });
                }
                return deptLinks;
            case "SUPER_ADMIN":
                return [
                    { name: "Dashboard", href: "/superadmin" },
                    { name: "Universities", href: "/superadmin/universities" },
                    { name: "Departments", href: "/superadmin/departments" },
                    { name: "Admin Management", href: "/superadmin/admins" },
                ];
            default:
                return [
                    { name: "Dashboard", href: "/dashboard" },
                ];
        }
    };

    const links = getLinks(user?.role);

    return (
        <UserProvider user={user}>
            <div className="antialiased min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40">
                {/* Animated Gradient Mesh Background */}
                <div className="fixed inset-0 -z-10">
                    {/* Base gradient layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/30" />

                    {/* Decorative gradient orbs */}
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 bg-grid-slate-100/[0.03] bg-[size:60px_60px]"
                        style={{ backgroundImage: 'linear-gradient(to right, rgb(148 163 184 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.03) 1px, transparent 1px)' }} />
                </div>

                <Toaster position="top-right" reverseOrder={false} />
                {/* Top Navbar with Links */}
                <Navbar user={user} links={links} />

                {/* Main Content with glassmorphism */}
                <main className="px-12 py-6 pt-32 pb-24 h-full min-h-screen container mx-auto relative">
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}
