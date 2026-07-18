import { UserSession } from "@/app/(auth)/_types/auth.types";
import { decryptSession } from "@/app/utils/session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function authMiddleware(request: NextRequest) {
    const session = request.cookies.get("ylawyer-session")?.value;

    const authRoutes = ["/login", "/register"];
    const protectedRoutes = ["/dashboard"];

    const { nextUrl } = request;
    const nextResponse = NextResponse.next();

    const isAuthRoute = authRoutes.some(
        (route) =>
            nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
    );
    const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
    );

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";

    if (!session) {
        if (isProtectedRoute) {
            const callbackUrl = encodeURIComponent(nextUrl.pathname);
            loginUrl.searchParams.set("callbackUrl", callbackUrl);
            return NextResponse.redirect(loginUrl);
        }
        return nextResponse;
    }

    try {
        const parsed = (await decryptSession(session)) as UserSession;
        const now = Date.now();
        const accessExpired = parsed.exp < now;
        const refreshExpired = parsed.sessionExpiry < now;

        if (!accessExpired && !refreshExpired && isAuthRoute) {
            const dashboardRoute = request.nextUrl.clone();
            dashboardRoute.pathname = "/dashboard";
            return NextResponse.redirect(dashboardRoute);
        }

        if (refreshExpired || (accessExpired && !refreshExpired)) {
            const cookieStore = await cookies();
            cookieStore.delete("ylawyer-session");
            return NextResponse.redirect(loginUrl);
        }
    } catch {
        return NextResponse.redirect(loginUrl);
    }

    return nextResponse;
}
