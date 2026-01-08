"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/user-context";
import { FileText, Trash2, Eye, ShieldAlert, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function ModerationPage() {
    const { data: session } = useSession();
    const { user } = useUser();
    // @ts-ignore
    const deptId = user?.departmentId || (session?.user as any)?.departmentId;

    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (deptId) fetchFiles();
    }, [deptId]);

    async function fetchFiles() {
        try {
            const res = await fetch(`/api/dept/moderation?departmentId=${deptId}`);
            if (res.ok) setFiles(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
    } | null>(null);

    async function handleDelete(id: string) {
        setConfirmAction({
            title: "Delete Content",
            message: "Permanently delete this content? This action cannot be undone.",
            isDanger: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/dept/moderation?id=${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Content removed");
                        fetchFiles();
                    }
                } catch (e) { console.error(e); }
            }
        });
    }

    // if (!deptId) return null;

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title || "Confirm Action"}
                message={confirmAction?.message || "Are you sure?"}
                onConfirm={confirmAction?.onConfirm || (() => { })}
                isDanger={confirmAction?.isDanger}
                confirmText={confirmAction?.confirmText}
            />

            <div>
                <h1 className="text-2xl font-bold text-gray-800">Content Moderation</h1>
                <p className="text-gray-500">Review and manage uploaded content.</p>
            </div>

            {loading ? <div className="text-center py-10">Loading uploads...</div> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {files.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-100" />
                            <p>All clean! No recent uploads found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">File Name</th>
                                        <th className="px-6 py-4">Uploaded By</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {files.map(file => (
                                        <tr key={file.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1">{file.name}</p>
                                                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">{file.uploaderName || "Unknown"}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${file.uploaderRole === 'TEACHER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {file.uploaderRole}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700">{file.courseCode}</p>
                                                <p className="text-xs text-gray-400">{file.courseName}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100">
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                    <button onClick={() => handleDelete(file.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
