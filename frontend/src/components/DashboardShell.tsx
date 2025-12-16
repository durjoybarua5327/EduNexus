"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

import { Toaster } from "react-hot-toast";

export function DashboardShell({ children, user }: { children: React.ReactNode, user: any }) {

    // Define links based on role (Logic moved from Sidebar)
    const getLinks = (role?: string) => {
        switch (role) {
            case "STUDENT":
            case "CR":
                return [
                    { name: "My Semester", href: "/dashboard/semester" },
                    { name: "Routine", href: "/dashboard/routine" },
                    { name: "Notices", href: "/dashboard/notices" },
                    { name: "Resources", href: "/dashboard/resources" },
                ];
            case "TEACHER":
                return [
                    { name: "My Courses", href: "/teacher/courses" },
                    { name: "Uploads", href: "/teacher/uploads" },
                    { name: "Notices", href: "/teacher/notices" },
                ];
            case "DEPT_ADMIN":
                return [
                    { name: "Overview", href: "/admin/overview" },
                    { name: "Faculty", href: "/admin/faculty" },
                    { name: "Batches", href: "/admin/batches" },
                    { name: "Academics", href: "/admin/academics" },
                    { name: "Notices", href: "/admin/notices" },
                ];
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
        <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Toaster position="top-right" reverseOrder={false} />
            {/* Top Navbar with Links */}
            <Navbar user={user} links={links} />

            {/* Main Content - Removed sidebar margin (sm:ml-64) */}
            <main className="p-4 pt-20 h-full min-h-screen container mx-auto">
                {children}
            </main>
        </div>
    );
}
