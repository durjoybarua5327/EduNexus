import { auth } from "@/auth";

const BACKEND_URL = "http://localhost:3001/api";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // In a real app we'd attach a token here
    // const session = await auth();
    // const token = session?.user?.accessToken; // If we had one

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            // "Authorization": `Bearer ${token}`
        },
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
