import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({
                error: "Not logged in",
                step: "Please login first"
            }, { status: 401 });
        }

        // Get full user from database
        const [dbUser] = await pool.query<any[]>(
            "SELECT id, name, email, role, isTopCR, isTopDepartmentAdmin FROM User WHERE id = ?",
            [session.user.id]
        );

        // Check session token structure
        const sessionData = {
            id: session.user.id,
            email: session.user.email,
            // @ts-ignore
            role: session.user.role,
            // @ts-ignore
            isTopCR: session.user.isTopCR,
            // @ts-ignore
            isTopDepartmentAdmin: session.user.isTopDepartmentAdmin,
            // @ts-ignore
            fullUserObject: session.user
        };

        const diagnosis = {
            database: dbUser[0] || null,
            session: sessionData,

            // Diagnostic checks
            checks: {
                userLoggedIn: !!session.user,
                databaseHasUser: dbUser.length > 0,
                databaseIsTopCR: dbUser[0]?.isTopCR === 1,
                sessionHasIsTopCR: sessionData.isTopCR !== undefined,
                sessionIsTopCRValue: sessionData.isTopCR,

                // Critical checks
                mismatch: dbUser[0]?.isTopCR === 1 && sessionData.isTopCR !== true,
                needsSessionRefresh: dbUser[0]?.isTopCR === 1 && sessionData.isTopCR !== true
            },

            instructions: dbUser[0]?.isTopCR === 1 && sessionData.isTopCR !== true ?
                "⚠️ MISMATCH DETECTED! Database has isTopCR=1 but session doesn't. You MUST logout and login again!" :
                sessionData.isTopCR === true ?
                    "✅ Everything is correct! Your session has isTopCR enabled." :
                    "⚠️ User is not marked as Top CR in database. Set isTopCR=1 in the User table first."
        };

        return NextResponse.json(diagnosis, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        console.error("Debug error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
