import { decryptSession, toPublicSession } from "@/app/utils/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("ylawyer-session")?.value;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decryptedSession = await decryptSession(session);
            // Never expose bearer access token to browser JS
            return NextResponse.json(toPublicSession(decryptedSession), {
                status: 200,
            });
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
