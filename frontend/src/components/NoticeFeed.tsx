"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Calendar, Megaphone, Pin, Tag, X, Clock, ArrowRight, Sparkles } from "lucide-react";
import parse from 'html-react-parser';

export function NoticeFeed({ notices }: { notices: any[] }) {
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);

    return (
        <>
            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.08 } }
                }}
            >
                {notices.map((notice) => (
                    <motion.div
                        key={notice.id}
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: { type: "spring", stiffness: 260, damping: 20 }
                            }
                        }}
                        whileHover={{ y: -8, scale: 1.01 }}
                        className={`
                            group relative bg-white rounded-[2rem] cursor-pointer overflow-hidden
                            border border-slate-100
                            shadow-slate-200/50 shadow-lg
                            hover:shadow-violet-200/50 hover:shadow-2xl hover:border-violet-100
                            transition-all duration-300
                        `}
                        onClick={() => setSelectedNotice(notice)}
                    >
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
                ))}
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedNotice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            onClick={() => setSelectedNotice(null)}
                            className="absolute inset-0 bg-slate-900/40 transition-all duration-300"
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
                            {/* Modal Header */}
                            <div className={`relative px-10 py-8 shrink-0
                                ${selectedNotice.priority === 'HIGH'
                                    ? 'bg-gradient-to-br from-rose-50 via-white to-white'
                                    : 'bg-gradient-to-br from-violet-50 via-white to-white'}
                            `}>
                                <button
                                    onClick={() => setSelectedNotice(null)}
                                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-white/50 backdrop-blur-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-wrap items-center gap-3 mb-5">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border
                                        ${selectedNotice.priority === 'HIGH'
                                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                                            : 'bg-violet-100 text-violet-700 border-violet-200'}
                                    `}>
                                        {selectedNotice.priority === 'HIGH' ? 'Critical Priority' : 'Notice Board'}
                                    </span>
                                    {!!selectedNotice.isPinned && (
                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                                            <Pin className="w-3 h-3 fill-current rotate-45" /> Pinned
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-[1.15]">
                                    {selectedNotice.title}
                                </h2>

                                <div className="flex items-center gap-3 mt-4 text-sm font-medium text-slate-500">
                                    <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(selectedNotice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
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
