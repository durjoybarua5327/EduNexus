"use client";

import { useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { uploadFile } from "@/lib/actions/files";
import { useRouter } from "next/navigation";

export function UploadFileModal({ folderId }: { folderId: string | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        if (!folderId) {
            alert("Please select a folder first");
            return;
        }
        setLoading(true);
        formData.append('folderId', folderId);

        const res = await uploadFile(formData);
        setLoading(false);
        if (res?.error) {
            alert("Upload failed");
        } else {
            setIsOpen(false);
            router.refresh();
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={!folderId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={!folderId ? "Open a folder to upload files" : "Upload File"}
            >
                <UploadCloud size={16} /> Upload File
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Upload File</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form action={handleSubmit} className="p-4 space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                <input type="file" name="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                                <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Click or drag file to upload</p>
                            </div>

                            <div className="pt-2">
                                <button disabled={loading} type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {loading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
