import { auth } from "@/auth";

const BACKEND_URL = "http://localhost:3001/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    let headersConfig: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    // Server-side: Forward cookies manually
    if (typeof window === 'undefined') {
        try {
            const { headers } = await import("next/headers");
            const headersList = await headers();
            const cookieHeader = headersList.get('cookie');
            if (cookieHeader) {
                headersConfig['Cookie'] = cookieHeader;
            }
        } catch (error) {
            console.warn("Could not load next/headers in fetchAPI", error);
        }
    }

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: headersConfig,
        cache: options.cache || 'no-store' // Default to no-store for dynamic data
    });

    if (!res.ok) {
        // Handle error
        // throw new Error("API Fetch Failed");
        console.error(`API Fetch Failed: ${res.status} ${res.statusText}`);
        return null; // Or throw
    }

    return res.json();
}

export async function getStudentProfile(userId?: string) {
    const url = userId ? `/student/profile?userId=${userId}` : '/student/profile';
    return await fetchAPI(url);
}

export async function getStudentCourses(departmentId: string, semesterId: string) {
    if (!departmentId || !semesterId) return [];
    return await fetchAPI(`/dept/courses?departmentId=${departmentId}&semesterId=${semesterId}`, { cache: 'no-store' }) || [];
}
