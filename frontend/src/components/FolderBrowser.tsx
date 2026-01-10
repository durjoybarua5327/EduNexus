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
}

export function FolderBrowser({ folders, files, breadcrumbs, currentFolderId, basePath, allowUploads = false, showPrivacy = false, isViewingOthers = false }: FolderBrowserProps) {
    const router = useRouter();

    // Filter out private content when viewing others
    const visibleFolders = isViewingOthers ? folders.filter(f => f.isPublic) : folders;
    const visibleFiles = isViewingOthers ? files.filter(f => f.isPublic) : files;


    const getHref = (id: string) => {
        const separator = basePath.includes('?') ? '&' : '?';
        return `${basePath}${separator}folderId=${id}`;
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-gray-500">
                <Link href={basePath} className="hover:text-gray-900">Home</Link>
                {breadcrumbs.map((crumb) => (
                    <div key={crumb.id} className="flex items-center">
                        <ChevronRight size={16} className="mx-1" />
                        <Link href={getHref(crumb.id)} className="hover:text-gray-900 font-medium text-gray-900">
                            {crumb.name}
                        </Link>
                    </div>
                ))}
            </nav>

            {/* Actions Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : "My Semester"}
                </h2>
                <div className="flex gap-2">
                    {allowUploads && (
                        <>
                            <CreateFolderModal parentId={currentFolderId} showPrivacy={showPrivacy} />
                            <UploadFileModal folderId={currentFolderId} />
                        </>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {visibleFolders.map((folder) => (
                    <Link
                        key={folder.id}
                        href={getHref(folder.id)}
                        className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer"
                    >
                        {showPrivacy === true && (
                            <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${folder.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {folder.isPublic ? 'Public' : 'Private'}
                            </div>
                        )}

                        {/* Folder Actions Menu - Only show if not viewing others */}
                        {!isViewingOthers && (
                            <div
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <FolderActions folder={folder} />
                            </div>
                        )}

                        <Folder size={48} className={`mb-3 transition duration-300 group-hover:scale-110 ${folder.isSystem ? 'text-amber-400' : 'text-indigo-400'}`} />

                        <span className="text-sm font-medium text-gray-700 text-center truncate w-full flex items-center justify-center gap-1.5">
                            {folder.isSystem === true && <Lock size={12} className="text-amber-500 shrink-0" />}
                            <span className="truncate">{folder.name}</span>
                        </span>

                        <span className="text-xs text-gray-400 mt-1">{folder._count?.total || 0} items</span>
                    </Link>
                ))}

                {visibleFiles.map((file) => (
                    <div
                        key={file.id}
                        onClick={() => window.open(file.url, '_blank')}
                        className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer"
                    >
                        {!isViewingOthers && (
                            <div
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-10"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    e.preventDefault();
                                }}
                            >
                                <FileActions file={file} />
                            </div>
                        )}
                        {/* Placeholder for file icon based on type */}
                        <FileText size={48} className="text-gray-400 mb-3 group-hover:scale-110 transition duration-300" />
                        <span className="text-sm font-medium text-gray-700 text-center truncate w-full">{file.name}</span>
                        <span className="text-xs text-gray-400 mt-1">
                            {file.size < 1024 * 1024
                                ? `${(file.size / 1024).toFixed(1)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                    </div>
                ))}

                {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        {isViewingOthers ? "No public files available." : "This folder is empty."}
                    </div>
                )}
            </div>
        </div >
    );
}
