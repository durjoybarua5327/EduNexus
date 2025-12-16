import { Plus } from "lucide-react";
import { CreateCourseModal } from "@/components/admin/CreateCourseModal";

export default function AcademicsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Academic Setup</h1>
                    <p className="text-gray-500 mt-1">Manage courses, class routines, and exam schedules.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Courses Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Courses</h2>
                        <CreateCourseModal />
                    </div>
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        No courses added yet.
                    </div>
                </div>

                {/* Routines Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Class Routine</h2>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <Plus size={16} /> Upload Routine
                        </button>
                    </div>
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        No routine uploaded.
                    </div>
                </div>

                {/* Exam Schedule */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Exam Schedule</h2>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            <Plus size={16} /> Create Schedule
                        </button>
                    </div>
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        No exam schedule active.
                    </div>
                </div>
            </div>
        </div>
    );
}
