"use client";

import { Folder, FileText, ChevronRight, MoreVertical, Plus, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CreateFolderModal } from "./CreateFolderModal";
import { UploadFileModal } from "./UploadFileModal";
import { FolderActions } from "./FolderActions";
import { FileActions } from "./FileActions";

interface FolderBrowserProps {
    folders: any[];
    files: any[];
    breadcrumbs: any[];
    currentFolderId: string | null;
    basePath: string;
    allowUploads?: boolean;
    showPrivacy?: boolean;
    isViewingOthers?: boolean; // When viewing another user's profile
    onRefresh?: () => void;
    rootTitle?: string;
    readOnly?: boolean;
}

export function FolderBrowser({ folders, files, breadcrumbs, currentFolderId, basePath, allowUploads = false, showPrivacy = false, isViewingOthers = false, onRefresh, rootTitle = "My Files", readOnly = false }: FolderBrowserProps) {
    const router = useRouter();

    // Filter out private content when viewing others
    const visibleFolders = isViewingOthers ? folders.filter(f => f.isPublic) : folders;
    const visibleFiles = isViewingOthers ? files.filter(f => f.isPublic) : files;


    const getHref = (id: string) => {
        const separator = basePath.includes('?') ? '&' : '?';
        return `${basePath}${separator}folderId=${id}`;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm font-medium text-slate-500 bg-white/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/60 shadow-sm w-fit">
                <Link href={basePath} className="hover:text-indigo-600 transition-colors">Home</Link>
                {breadcrumbs.map((crumb) => (
                    <div key={crumb.id} className="flex items-center">
                        <ChevronRight size={14} className="mx-2 text-slate-300" />
                        <Link href={getHref(crumb.id)} className="hover:text-indigo-600 transition-colors text-slate-700">
                            {crumb.name}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* Actions Bar & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                        <Folder className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : rootTitle}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Manage your course materials</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {allowUploads && (
                        <>
                            <CreateFolderModal parentId={currentFolderId} showPrivacy={showPrivacy} onSuccess={onRefresh} />
                            <UploadFileModal folderId={currentFolderId} showPrivacy={showPrivacy} onSuccess={onRefresh} />
                        </>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleFolders.map((folder) => (
                    <Link
                        key={folder.id}
                        href={getHref(folder.id)}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer" // Removed overflow-hidden
                    >
                        {/* Background Container for Clipping Blobs */}
                        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                            {/* Decorative Blob */}
                            <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                        </div>

                        {/* Always show public/private badge */}
                        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider z-20 shadow-sm ${folder.isPublic ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                            {folder.isPublic ? '🌐 Public' : '🔒 Private'}
                        </div>

                        {/* Folder Actions Menu - HIGH Z-INDEX + VISIBLE */}
                        {!isViewingOthers && !readOnly && (
                            <div
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all z-50"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <FolderActions folder={folder} onSuccess={onRefresh} />
                            </div>
                        )}

                        <div className="mb-4 relative z-10">
                            {/* Small glow behind icon only */}
                            <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Folder size={64} className={`relative z-10 transition duration-300 group-hover:scale-110 ${folder.isSystem ? 'text-amber-400 drop-shadow-sm' : 'text-indigo-500 drop-shadow-sm'}`} />
                        </div>

                        <span className="text-sm font-bold text-slate-700 text-center truncate w-full flex items-center justify-center gap-1.5 px-2 relative z-10">
                            {folder.isSystem === true && <Lock size={12} className="text-amber-500 shrink-0" />}
                            <span className="truncate">{folder.name}</span>
                        </span>

                        <span className="text-xs font-semibold text-slate-400 mt-1 relative z-10">{folder._count?.total || 0} items</span>
                    </Link>
                ))}

                {visibleFiles.map((file) => (
                    <div
                        key={file.id}
                        onClick={() => window.open(file.url, '_blank')}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer" // Removed overflow-hidden
                    >
                        {/* Background Container for Clipping Blobs */}
                        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                        </div>

                        {/* Always show public/private badge for files */}
                        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider z-20 shadow-sm ${file.isPublic ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                            {file.isPublic ? '🌐 Public' : '🔒 Private'}
                        </div>

                        {!isViewingOthers && !readOnly && (
                            <div
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all z-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                            >
                                <FileActions file={file} onSuccess={onRefresh} />
                            </div>
                        )}

                        <div className="mb-4 relative z-10">
                            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <FileText size={64} className="relative z-10 text-slate-400 mb-2 group-hover:text-blue-500 group-hover:scale-110 transition duration-300 drop-shadow-sm" />
                        </div>

                        <span className="text-sm font-bold text-slate-700 text-center truncate w-full px-2 relative z-10">{file.name}</span>
                        <span className="text-xs font-semibold text-slate-400 mt-1 bg-slate-100 px-2 py-0.5 rounded-md relative z-10">
                            {file.size < 1024 * 1024
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                    </div>
                ))}

                {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/50 rounded-[2.5rem] border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Empty Folder</h3>
                        <p className="text-slate-500 font-medium">
                            {isViewingOthers ? "No public files available." : "Use the buttons above to add content."}
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
