import { NextRequest } from "next/server";
import { authMiddleware } from "@/app/core/middleware/auth";

export async function middleware(request: NextRequest) {
   return await authMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
    // matcher: '/login'
}

