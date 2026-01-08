"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Calendar, Megaphone, Pin, Tag, X, Clock, ArrowRight, Sparkles, Search, Filter } from "lucide-react";
import parse from 'html-react-parser';

export function NoticeFeed({ notices }: { notices: any[] }) {
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    const filteredNotices = useMemo(() => {
        return notices.filter(notice => {
            const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [notices, searchQuery]);

    const filteredAndSortedNotices = useMemo(() => {
        return [...filteredNotices].sort((a, b) => {
            return sortOrder === "newest"
                ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }, [filteredNotices, sortOrder]);

    useEffect(() => {
        if (selectedNotice) {
            document.body.style.overflow = 'hidden';
            // Also add padding to right to prevent layout shift if scrollbar disappears
            // document.body.style.paddingRight = 'var(--scrollbar-width)'; 
        } else {
            document.body.style.overflow = 'unset';
            // document.body.style.paddingRight = '0';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedNotice]);

    return (
        <>
            {/* Search and Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search notices by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-900 bg-white shadow-sm placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                    {['newest', 'oldest'].map((order) => (
                        <button
                            key={order}
                            onClick={() => setSortOrder(order)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all ${sortOrder === order
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                        >
                            {order === 'newest' ? 'NEWEST' : 'OLDEST'}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.08 } }
                }}
            >
                {filteredAndSortedNotices.length > 0 ? (
                    filteredAndSortedNotices.map((notice) => (
                        <motion.div
                            key={notice.id}
                            layout
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            whileHover={{ y: -8, scale: 1.01 }}
                            className={`
                            group relative bg-white dark:bg-slate-800 rounded-[2rem] cursor-pointer overflow-hidden
                            border border-slate-100 dark:border-slate-700
                            shadow-xl shadow-slate-200/40 dark:shadow-black/20
                            hover:shadow-2xl hover:shadow-violet-200/50 dark:hover:shadow-violet-900/20
                            hover:-translate-y-1 transition-all duration-500
                        `}
                            onClick={() => setSelectedNotice(notice)}
                        >
                            {/* Colorful Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Decorative Gradient Blob */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative p-7 h-full flex flex-col">
                                {/* Header: Icon & Date */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm
                                    ${notice.priority === 'HIGH'
                                            ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                                            : 'bg-slate-50 text-slate-600 group-hover:bg-violet-50 group-hover:text-violet-600 ring-1 ring-slate-100 group-hover:ring-violet-100'} 
                                    transition-all duration-300
                                `}>
                                        {notice.priority === 'HIGH' ? <Megaphone className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                    </div>
                                    {!!notice.isPinned && (
                                        <div className="bg-violet-50 p-2 rounded-xl text-violet-600 ring-1 ring-violet-100">
                                            <Pin className="w-4 h-4 fill-current rotate-45" />
                                        </div>
                                    )}
                                </div>

                                {/* Priority Badge (if HIGH) */}
                                {notice.priority === 'HIGH' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-50 text-rose-600 w-fit mb-3 ring-1 ring-rose-100">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                        Critical Update
                                    </span>
                                )}

                                <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-violet-700 transition-colors">
                                    {notice.title}
                                </h3>

                                {/* Preview Text */}
                                <div className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed [&>p]:inline">
                                    {parse(typeof notice.description === 'string' ? notice.description : '')}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-auto">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2 text-violet-600 text-sm font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        Read More <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <Search className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No notices found</h3>
                        <p className="text-slate-500">Try adjusting your search.</p>
                        <button
                            onClick={() => { setSearchQuery(""); setSortOrder("newest"); }}
                            className="mt-4 text-violet-600 font-bold text-sm hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedNotice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNotice(null)}
                            className="absolute inset-0 bg-slate-900/60 transition-all duration-300"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                transition: { type: "spring", bounce: 0.35, duration: 0.6 }
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 ring-1 ring-black/5"
                        >
                            {/* Vibrant Modal Header */}
                            <div className={`relative px-8 py-5 shrink-0 overflow-hidden
                                ${selectedNotice.priority === 'HIGH'
                                    ? 'bg-gradient-to-br from-rose-500 to-orange-600'
                                    : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600'}
                            `}>
                                {/* Decorative Circles */}
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/5 rounded-full blur-2xl pointer-events-none"></div>

                                <button
                                    onClick={() => setSelectedNotice(null)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-md z-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/20 backdrop-blur-md
                                            ${selectedNotice.priority === 'HIGH'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white/20 text-white'}
                                        `}>
                                            {selectedNotice.priority === 'HIGH' ? 'Critical Priority' : 'Notice Board'}
                                        </span>
                                        {!!selectedNotice.isPinned && (
                                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-400/20 text-amber-100 rounded-full text-[10px] font-bold border border-amber-200/20 backdrop-blur-md">
                                                <Pin className="w-3 h-3 fill-current rotate-45" /> Pinned
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-2 tracking-tight">
                                        {selectedNotice.title}
                                    </h2>

                                    <div className="flex items-center gap-4 text-sm font-medium text-white/80 mt-4">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-white/60" />
                                            {new Date(selectedNotice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </span>
                                        {selectedNotice.expiryDate && (
                                            <span className="flex items-center gap-2 text-orange-200">
                                                <Clock className="w-4 h-4" />
                                                Expires {new Date(selectedNotice.expiryDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="px-10 pb-10 overflow-y-auto custom-scrollbar bg-white">
                                <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-8 [&>p]:mb-6 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-6 [&>ol]:list-decimal [&>ol]:pl-5 [&>h1]:text-slate-900 [&>h2]:text-slate-900 [&>strong]:text-slate-900">
                                    {parse(typeof selectedNotice.description === 'string' ? selectedNotice.description : '')}
                                </div>

                                {(selectedNotice.tags?.length > 0 || selectedNotice.expiryDate) && (
                                    <div className="mt-12 pt-8 border-t border-slate-100 bg-slate-50/50 -mx-10 px-10 pb-4">
                                        {selectedNotice.expiryDate && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm bg-orange-50 w-fit px-3 py-1.5 rounded-lg border border-orange-100">
                                                    <Clock className="w-4 h-4" />
                                                    Valid until {new Date(selectedNotice.expiryDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                        {selectedNotice.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedNotice.tags.map((tag: string) => (
                                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-bold border border-slate-200 uppercase tracking-wide">
                                                        <Tag className="w-3 h-3 text-slate-400" />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
