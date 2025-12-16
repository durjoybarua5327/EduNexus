import { getBatches } from "@/lib/actions/admin";
import { Users } from "lucide-react";
import { CreateBatchModal } from "@/components/admin/CreateBatchModal";

export default async function BatchesPage() {
    const batches = await getBatches();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Batch Management</h1>
                    <p className="text-gray-500 mt-1">Create batches and assign Class Representatives.</p>
                </div>
                <CreateBatchModal />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {batches.map((batch) => (
                    <div key={batch.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{batch.name}</h3>
                                <p className="text-sm text-gray-500">Computer Science</p>
                            </div>
                            <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                Active
                            </div>
                        </div>

                        <div className="mt-4 flex items-center text-sm text-gray-600">
                            <Users size={16} className="mr-2 text-gray-400" />
                            {batch._count.students} Students
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <button className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                Manage Students & CRs
                            </button>
                        </div>
                    </div>
                ))}

                {batches.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No batches found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
