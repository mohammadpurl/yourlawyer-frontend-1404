import { cookies } from "next/headers";
import { UserSession } from "@/app/(auth)/_types/auth.types";
import { JWTPayload, jwtVerify, SignJWT } from "jose";

const JWT_SERVER_SECRET = process.env.JWT_SERVER_SECRET;

type SessionPayload = JWTPayload & {
    userName: string;
    fullName: string;
    pic: string;
    accesstoken: string;
    sessionId: string;
    sessionExpiry: number;
    /** Access-token expiry in ms (avoid colliding with JWT `exp` seconds). */
    accessExp: number;
    plan?: UserSession["plan"];
};

export async function encryptSession(session: UserSession): Promise<string> {
    if (!JWT_SERVER_SECRET) {
        throw new Error("JWT_SERVER_SECRET is not set");
    }

    const sessionExpiryMs =
        session.sessionExpiry && session.sessionExpiry > Date.now()
            ? session.sessionExpiry
            : Date.now() + 60 * 60 * 1000;

    const payload: SessionPayload = {
        userName: session.userName,
        fullName: session.fullName,
        pic: session.pic,
        accesstoken: session.accesstoken,
        sessionId: session.sessionId,
        sessionExpiry: sessionExpiryMs,
        accessExp: session.exp,
        plan: session.plan,
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(Math.floor(sessionExpiryMs / 1000))
        .sign(new TextEncoder().encode(JWT_SERVER_SECRET));

    return token;
}

export async function decryptSession(session: string): Promise<UserSession> {
    if (!JWT_SERVER_SECRET) {
        throw new Error("JWT_SERVER_SECRET is not set");
    }
    const { payload } = await jwtVerify(
        session,
        new TextEncoder().encode(JWT_SERVER_SECRET)
    );
    const p = payload as SessionPayload;
    return {
        userName: p.userName,
        fullName: p.fullName,
        pic: p.pic,
        exp: p.accessExp,
        accesstoken: p.accesstoken,
        sessionId: p.sessionId,
        sessionExpiry: p.sessionExpiry,
        plan: p.plan,
    };
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("ylawyer-session")?.value;
    if (!sessionCookie) {
        return null;
    }
    return decryptSession(sessionCookie);
}

/** Safe subset of session for browser/client consumption (no access token). */
export function toPublicSession(session: UserSession) {
    return {
        userName: session.userName,
        fullName: session.fullName,
        pic: session.pic,
        exp: session.exp,
        sessionId: session.sessionId,
        sessionExpiry: session.sessionExpiry,
        plan: session.plan,
    };
}

export type PublicSession = ReturnType<typeof toPublicSession>;
