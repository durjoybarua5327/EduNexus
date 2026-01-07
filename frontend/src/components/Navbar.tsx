"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu, LogOut, Link as LinkIcon,
    LayoutDashboard, Globe, Share2, ShieldCheck,
    Library, CalendarRange, Megaphone, StickyNote,
    Upload, GraduationCap, Users2, Layers, BookOpenCheck
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

interface NavbarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
    links?: { name: string; href: string; icon?: any }[];
    onMenuClick?: () => void;
}

export function Navbar({ user, links = [], onMenuClick }: NavbarProps) {
    const pathname = usePathname();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to get icon based on name
    const getIcon = (name: string) => {
        switch (name) {
            case "Dashboard": return <LayoutDashboard className="w-4 h-4" />;
            case "Overview": return <LayoutDashboard className="w-4 h-4" />;
            case "Universities": return <Globe className="w-4 h-4" />;
            case "Departments": return <Share2 className="w-4 h-4" />;
            case "Admin Management": return <ShieldCheck className="w-4 h-4" />;
            case "Admin": return <ShieldCheck className="w-4 h-4" />;
            case "My Semester": return <Library className="w-4 h-4" />;
            case "Routine": return <CalendarRange className="w-4 h-4" />;
            case "Notices": return <Megaphone className="w-4 h-4" />;
            case "Notice": return <Megaphone className="w-4 h-4" />;
            case "Resources": return <StickyNote className="w-4 h-4" />;
            case "Courses": return <BookOpenCheck className="w-4 h-4" />;
            case "Academics": return <CalendarRange className="w-4 h-4" />;
            case "Teachers": return <GraduationCap className="w-4 h-4" />;
            case "Faculty": return <GraduationCap className="w-4 h-4" />;
            case "Batches": return <Layers className="w-4 h-4" />;
            case "Uploads": return <Upload className="w-4 h-4" />;
            case "My Batch": return <Users2 className="w-4 h-4" />;
            default: return <LinkIcon className="w-4 h-4" />;
        }
    };

    return (
        <nav className="fixed z-40 w-full top-6 pointer-events-none">
            <div className="max-w-[1600px] mx-auto px-6 pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl shadow-indigo-500/10 flex items-center justify-between h-20 px-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.005] relative">

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onMenuClick}
                            type="button"
                            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link
                            href={
                                user?.role === 'SUPER_ADMIN' ? '/superadmin/overview' :
                                    user?.role === 'DEPT_ADMIN' ? '/admin/overview' :
                                        user?.role === 'TEACHER' ? '/teacher/courses' :
                                            user?.role === 'STUDENT' || user?.role === 'CR' ? '/dashboard/semester' :
                                                '/dashboard'
                            }
                            className="flex items-center gap-0.5 group relative pl-2 active:scale-95 transition-transform duration-100"
                        >
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-0 group-active:opacity-50 transition duration-200"></div>
                            <div className="relative w-14 h-14 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <img src="/logo.png" alt="EduNexus Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="self-center text-xl font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 group-active:from-blue-700 group-active:to-cyan-700 transition-all duration-200 tracking-tight pl-1">
                                EduNexus
                            </span>
                        </Link>
                    </div>

                    {/* Horizontal Navigation Links - Centered */}
                    <div className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {links.map((link) => {
                            const isRootPath = link.href === '/superadmin' || link.href === '/dashboard';
                            const isActive = pathname === link.href || (!isRootPath && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`
                                            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 relative group
                                            ${isActive ? "text-indigo-700" : "text-gray-500 hover:text-gray-900"}
                                        `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active"
                                            className="absolute inset-0 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-500"}`}>
                                        {getIcon(link.name)}
                                    </span>
                                    <span className="relative z-10">{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center ml-3 relative" ref={profileRef}>
                            <button
                                type="button"
                                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-indigo-100 items-center justify-center w-11 h-11 transition-all active:scale-95 shadow-lg shadow-indigo-100 border-2 border-white hover:border-indigo-100"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <span className="sr-only">Open user menu</span>
                                {user?.image ? (
                                    <img className="w-full h-full rounded-full object-cover" src={user.image} alt="user photo" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || "U"}
                                    </div>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="z-50 absolute right-0 top-16 my-2 text-base list-none bg-white/95 backdrop-blur-xl divide-y divide-gray-100 rounded-2xl shadow-xl shadow-indigo-500/10 border border-white/20 w-64 animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5">
                                    <div className="px-5 py-4 bg-gradient-to-b from-indigo-50/30 to-transparent rounded-t-2xl" role="none">
                                        <p className="text-sm font-semibold text-gray-900" role="none">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5" role="none">
                                            {user?.email}
                                        </p>
                                        <span className="inline-flex mt-3 items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                            {user?.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => signOut()}
                                            className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium group"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-4 h-4 mr-3 group-hover:-translate-x-0.5 transition-transform" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav >
    );
}
