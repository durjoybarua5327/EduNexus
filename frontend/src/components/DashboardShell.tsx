"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export function DashboardShell({ children, user }: { children: React.ReactNode, user: any }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Navbar user={user} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
            <Sidebar isOpen={isSidebarOpen} role={user?.role} />

            <main className="p-4 sm:ml-64 pt-20 h-full min-h-screen">
                {children}
            </main>
        </div>
    );
}
