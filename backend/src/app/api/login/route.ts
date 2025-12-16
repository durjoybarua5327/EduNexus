import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    }).safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        // Return user info. In a real app we'd sign a JWT here.
        // For this demo, we trust the Frontend's NextAuth to handle the session
        // but we normally should return a token for API access.
        // We will return a dummy token or user ID.

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });

    } catch (e) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
