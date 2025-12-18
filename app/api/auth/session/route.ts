import { decryptSession } from "@/app/utils/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('ylawyer-session')?.value;

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }   
    const decryptedSession = await decryptSession(session);
    if (!decryptedSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return new Response(JSON.stringify(decryptedSession), { status: 200 });
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const session = cookieStore.get('ylawyer-session')?.value;
    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }
}