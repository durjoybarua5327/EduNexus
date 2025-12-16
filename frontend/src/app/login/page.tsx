import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">EduNexus</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
