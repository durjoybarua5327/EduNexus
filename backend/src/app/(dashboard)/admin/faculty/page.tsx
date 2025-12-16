import { getFaculty } from "@/lib/actions/admin";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { Mail, Briefcase, Calendar } from "lucide-react";

export default async function FacultyPage() {
    const faculty = await getFaculty();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Faculty Management</h1>
                    <p className="text-gray-500 mt-1">Manage teachers, assignments, and profiles.</p>
                </div>
                <CreateUserModal role="TEACHER" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {faculty.map((teacher) => (
                    <div key={teacher.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                    {teacher.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                                    <p className="text-sm text-gray-500">{teacher.teacherProfile?.designation || "Faculty Member"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                                <Mail size={16} className="mr-2 text-gray-400" />
                                {teacher.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Briefcase size={16} className="mr-2 text-gray-400" />
                                0 Active Courses
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar size={16} className="mr-2 text-gray-400" />
                                Joined {new Date(teacher.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View Profile</button>
                            <span className="text-gray-300">|</span>
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Assign Course</button>
                        </div>
                    </div>
                ))}

                {faculty.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No faculty members found. Add one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
