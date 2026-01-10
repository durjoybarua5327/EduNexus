"use client";

import { motion } from "framer-motion";
import { Megaphone, Bell, Pin, Calendar, ArrowRight, User, Trash2, Pencil } from "lucide-react";
import parse from 'html-react-parser';

interface NoticeGridProps {
    title: string;
    notices: any[];
    onSelect: (notice: any) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
    onEdit?: (notice: any, e: React.MouseEvent) => void;
    icon?: React.ReactNode;
    color?: "indigo" | "violet" | "emerald" | "rose";
    currentUserId?: string;
}

export function NoticeGrid({ title, notices, onSelect, onDelete, onEdit, icon, color = "indigo", currentUserId }: NoticeGridProps) {
    if (!notices || notices.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                {icon && <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>{icon}</div>}
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">{notices.length}</span>
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                {notices.map((notice) => {
                    // Only show edit/delete buttons if user is the author
                    const isAuthor = currentUserId && notice.authorId === currentUserId;

                    return (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            onClick={() => onSelect(notice)}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-md shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                        >
                            {/* Status Bar */}
                            {notice.priority === 'HIGH' && (
                                <div className="h-1.5 w-full bg-rose-500" />
                            )}

                            <div className="p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0
                                        ${notice.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}
                                    `}>
                                        {notice.priority === 'HIGH' ? <Megaphone className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                    </div>
                                    <div className="flex items-center gap-1.5 pl-2">
                                        {!!notice.isPinned && (
                                            <Pin className="w-4 h-4 text-amber-500 fill-current rotate-45 shrink-0" />
                                        )}
                                        {/* Only show edit button if user is the author */}
                                        {onEdit && isAuthor && (
                                            <button
                                                onClick={(e) => onEdit(notice, e)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors z-20"
                                                title="Edit Notice"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        {/* Only show delete button if user is the author */}
                                        {onDelete && isAuthor && (
                                            <button
                                                onClick={(e) => onDelete(notice.id, e)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors z-20"
                                                title="Delete Notice"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 leading-snug mb-2 line-clamp-2 min-h-[1.5rem] group-hover:text-indigo-600 transition-colors">
                                    {notice.title}
                                </h3>

                                <div className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed break-words">
                                    {parse(typeof notice.description === 'string' ? notice.description : '')}
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[80px]">{notice.authorName}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
