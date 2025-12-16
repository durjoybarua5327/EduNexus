import pool from "@/lib/db";
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
        const [rows] = await pool.query<any[]>("SELECT * FROM User WHERE email = ?", [email]);
        const user = rows[0];

        if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
