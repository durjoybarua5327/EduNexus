"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu, LogOut, Link as LinkIcon,
    LayoutGrid, Globe, Share2, ShieldCheck,
    Library, CalendarDays, Megaphone, FolderOpen,
    Upload, GraduationCap, UsersRound, Layers, BookOpenCheck,
    Home, User, BellRing
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
            case "Home": return <Home className="w-5 h-5" />;
            case "Dashboard": case "Overview": return <LayoutGrid className="w-5 h-5" />;
            case "Profile": return <User className="w-5 h-5" />;

            case "My Semester": return <Library className="w-5 h-5" />;
            case "Routine": return <CalendarDays className="w-5 h-5" />;
            case "Notices": case "Notice": return <BellRing className="w-5 h-5" />;
            case "Class Notice": return <Megaphone className="w-5 h-5" />;

            case "Resources": return <FolderOpen className="w-5 h-5" />;
            case "Courses": return <BookOpenCheck className="w-5 h-5" />;
            case "Uploads": return <Upload className="w-5 h-5" />;
            case "Batch": return <UsersRound className="w-5 h-5" />;

            case "Universities": return <Globe className="w-5 h-5" />;
            case "Departments": return <Share2 className="w-5 h-5" />;
            case "Admin Management": case "Admin": return <ShieldCheck className="w-5 h-5" />;
            case "Batches": return <Layers className="w-5 h-5" />;
            case "Teachers": case "Faculty": return <GraduationCap className="w-5 h-5" />;

            default: return <LinkIcon className="w-5 h-5" />;
        }
    };

    return (
        <nav className="fixed z-40 w-full top-4 pointer-events-none">
            <div className="max-w-full mx-auto px-6 pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-2xl shadow-slate-200/50 flex items-center justify-between h-20 px-16 transition-all duration-500 hover:shadow-slate-300/50 relative">

                    {/* Logo Area */}
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
                                            user?.role === 'STUDENT' || user?.role === 'CR' ? '/student/home' :
                                                '/dashboard'
                            }
                            className="flex items-center gap-3 group relative pl-2 active:scale-95 transition-transform duration-100"
                        >
                            <div className="relative w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <img src="/logo.png" alt="EduNexus Logo" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            <span className="self-center text-2xl font-black whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-violet-800 to-slate-900 tracking-tight">
                                EduNexus
                            </span>
                        </Link>
                    </div>

                    {/* Horizontal Navigation Links - Centered */}
                    <div className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-slate-50/50 rounded-[2rem] border border-white/20 backdrop-blur-sm">
                        {links.map((link) => {
                            // Robust Active Logic
                            const normalize = (path: string) => path.replace(/\/$/, '');
                            const normalizedPath = normalize(pathname);
                            const normalizedLink = normalize(link.href);

                            // Define roots that require exact matching to avoid double-highlighting with children
                            const exactMatchRoots = ['/dashboard', '/superadmin', '/student/home'];
                            const isRoot = exactMatchRoots.includes(link.href);

                            const isActive = normalizedPath === normalizedLink ||
                                (!isRoot && normalizedPath.startsWith(normalizedLink + '/'));

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-500 group overflow-hidden ${isActive ? '' : 'hover:bg-white/50'}`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active"
                                            className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 rounded-2xl"
                                            style={{ borderRadius: 9999 }}
                                            initial={false} // Prevent initial animation glitch
                                            transition={{
                                                type: "spring",
                                                stiffness: 120, // Low stiffness = visible movement
                                                damping: 15,    // Low damping = bouncy/fluid
                                                mass: 1,
                                                duration: 0.6   // Explicit duration fallback
                                            }}
                                        />
                                    )}
                                    <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-violet-600'}`}>
                                        {getIcon(link.name)}
                                    </span>
                                    <span className={`relative z-10 transition-colors duration-300 whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-violet-900'}`}>
                                        {link.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center ml-3 relative" ref={profileRef}>
                            <button
                                type="button"
                                className="flex text-sm bg-slate-100 rounded-full focus:ring-4 focus:ring-violet-100 items-center justify-center w-11 h-11 transition-all active:scale-95 shadow-sm hover:shadow-md border-2 border-white hover:border-violet-100"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <span className="sr-only">Open user menu</span>
                                {user?.image ? (
                                    <img className="w-full h-full rounded-full object-cover" src={user.image} alt="user photo" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600 flex items-center justify-center font-bold text-lg">
                                        {user?.name?.[0] || "U"}
                                    </div>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="z-50 absolute right-0 top-16 my-2 text-base list-none bg-white/80 backdrop-blur-2xl divide-y divide-slate-100 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white/40 w-72 animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5">
                                    <div className="px-6 py-6 bg-gradient-to-b from-violet-50/50 to-transparent rounded-t-[2rem]" role="none">
                                        <p className="text-base font-bold text-slate-900" role="none">
                                            {user?.name || "User"}
                                        </p>
                                        <p className="text-sm text-slate-500 truncate mt-0.5 font-medium" role="none">
                                            {user?.email}
                                        </p>
                                        <span className="inline-flex mt-4 items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-900 text-white border border-slate-700 uppercase tracking-widest shadow-lg shadow-slate-200">
                                            {user?.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => signOut()}
                                            className="flex w-full items-center px-4 py-3 text-sm text-rose-600 rounded-2xl hover:bg-rose-50 transition-colors font-bold group"
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
        </nav>
    );
}
