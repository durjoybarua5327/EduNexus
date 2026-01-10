"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Tag, Pin, User, AlertCircle } from "lucide-react";
import parse from 'html-react-parser';

interface SmallNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    notice: any;
}

export function SmallNoticeModal({ isOpen, onClose, notice }: SmallNoticeModalProps) {
    if (!isOpen || !notice) return null;

    const isHighPriority = notice.priority === 'HIGH';
    const authorInitial = notice.authorName ? notice.authorName[0].toUpperCase() : (notice.authorRole === 'TEACHER' ? 'T' : 'C');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-300"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: "spring", bounce: 0.25, duration: 0.5 }
                        }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[85vh] ring-1 ring-white/20"
                    >
                        {/* Decorative Top Bar */}
                        <div className={`h-2 w-full ${isHighPriority ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600' : 'bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500'}`} />

                        {/* Content Container */}
                        <div className="flex flex-col h-full overflow-hidden">

                            {/* Header Section */}
                            <div className="relative px-8 pt-8 pb-6 shrink-0 bg-white z-20">
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {isHighPriority && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold ring-1 ring-rose-100">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Critical Update
                                        </span>
                                    )}
                                    {!isHighPriority && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold ring-1 ring-indigo-100">
                                            <Tag className="w-3.5 h-3.5" />
                                            General Notice
                                        </span>
                                    )}
                                    {!!notice.isPinned && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold ring-1 ring-amber-100">
                                            <Pin className="w-3.5 h-3.5 fill-amber-600" /> Pinned
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-6">
                                    {notice.title}
                                </h2>

                                {/* Author & Meta */}
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md
                                            ${isHighPriority ? 'bg-rose-500' : 'bg-indigo-600'}
                                        `}>
                                            {authorInitial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {notice.authorName || 'Unknown Author'}
                                            </p>
                                            <p className="text-xs font-medium text-slate-500">
                                                {notice.authorRole === 'TEACHER' ? 'Faculty Member' : 'Class Representative'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-2">
                                            <Calendar className={`w-4 h-4 ${isHighPriority ? 'text-rose-500' : 'text-indigo-500'}`} />
                                            {new Date(notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </span>
                                        {notice.expiryDate && (
                                            <span className="flex items-center gap-2 text-slate-500">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                Expires: <span className="text-orange-600 font-bold">{new Date(notice.expiryDate).toLocaleDateString()}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50/50">
                                <div className="p-8">
                                    <article className="prose prose-slate prose-lg max-w-none w-full break-words
                                        prose-headings:font-bold prose-headings:text-slate-800 
                                        prose-p:text-slate-600 prose-p:leading-relaxed
                                        prose-a:text-indigo-600 prose-a:font-medium hover:prose-a:text-indigo-700
                                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
                                        prose-strong:text-slate-900 prose-strong:font-bold
                                        prose-li:marker:text-indigo-400
                                        prose-pre:whitespace-pre-wrap prose-pre:break-words
                                        [&_*]:break-words
                                    ">
                                        {parse(typeof notice.description === 'string' ? notice.description : '')}
                                    </article>
                                </div>
                            </div>

                            {/* Footer / Tags */}
                            {(notice.tags && notice.tags.length > 0) && (
                                <div className="px-8 py-5 bg-white border-t border-slate-100 shrink-0">
                                    <div className="flex flex-wrap gap-2">
                                        {notice.tags.map((tag: string) => (
                                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-default">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
