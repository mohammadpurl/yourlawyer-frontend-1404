'use server';
import { cookies, headers } from "next/headers";
import { JWT, SignInModel, UserResponse, UserSession, MobileRequestModel, VerifyCodeModel, SendVerificationCodeResponse } from "@/app/(auth)/_types/auth.types";
import { jwtDecode } from "jwt-decode";
import { decryptSession, encryptSession } from "@/app/utils/session";
import { createData } from "@/app/core/http-service/http-service";

// Helper function for structured logging
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[AUTH-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function sendVerificationCodeAction(model: MobileRequestModel) {
    const startTime = Date.now();
    log('info', 'sendVerificationCodeAction started', { mobile: model.mobile });
    
    try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        
        // Log environment configuration
        log('info', 'Environment configuration', {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            API_URL: process.env.API_URL,
            NODE_ENV: process.env.NODE_ENV,
        });
        
        log('info', 'Preparing request to /auth/login', {
            mobile: model.mobile,
            userAgent: userAgent.substring(0, 50) + '...', // Truncate for privacy
        });
        
        const requestStartTime = Date.now();
        const response = await createData<{ mobile: string }, SendVerificationCodeResponse>(
            '/auth/login',
            { ...model }
        );
        const requestDuration = Date.now() - requestStartTime;
        
        log('info', 'Request to /auth/login completed successfully', {
            duration: `${requestDuration}ms`,
            responseMessage: response.message,
        });
        
        const totalDuration = Date.now() - startTime;
        log('info', 'sendVerificationCodeAction completed successfully', {
            totalDuration: `${totalDuration}ms`,
        });
        
        return { success: true, message: response.message };
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const axiosError = err as { message?: string; code?: string; response?: { data?: unknown; status?: number }; stack?: string };
        log('error', 'sendVerificationCodeAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: axiosError?.message,
                code: axiosError?.code,
                response: axiosError?.response?.data,
                status: axiosError?.response?.status,
                stack: axiosError?.stack,
            },
        });
        return { success: false, error: 'خطا در ارسال کد تأیید' };
    }
}

export async function verifyCodeAction(model: VerifyCodeModel) {
    const startTime = Date.now();
    log('info', 'verifyCodeAction started', { mobile: model.mobile, codeLength: model.code?.length });
    
    try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';
        
        log('info', 'Preparing request to /auth/otp/verify', {
            mobile: model.mobile,
            codeLength: model.code?.length,
        });
        
        const requestStartTime = Date.now();
        const user = await createData<{ mobile: string; code: string; userAgent: string }, UserResponse>(
            '/auth/otp/verify',
            { ...model, userAgent }
        );
        const requestDuration = Date.now() - requestStartTime;
        
        log('info', 'Request to /auth/otp/verify completed successfully', {
            duration: `${requestDuration}ms`,
            hasAccessToken: !!user?.accessToken,
            hasSessionId: !!user?.sessionId,
        });
        
        log('info', 'Setting auth cookie...');
        const cookieStartTime = Date.now();
        await SetAuthCookieAction(user);
        const cookieDuration = Date.now() - cookieStartTime;
        log('info', 'Auth cookie set successfully', { duration: `${cookieDuration}ms` });
        
        const totalDuration = Date.now() - startTime;
        log('info', 'verifyCodeAction completed successfully', {
            totalDuration: `${totalDuration}ms`,
        });
        
        return { success: true, data: user };
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const axiosError = err as { message?: string; code?: string; response?: { data?: unknown; status?: number }; stack?: string };
        log('error', 'verifyCodeAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: axiosError?.message,
                code: axiosError?.code,
                response: axiosError?.response?.data,
                status: axiosError?.response?.status,
                stack: axiosError?.stack,
            },
        });
        return { success: false, error: 'کد تأیید نامعتبر است' };
    }
}

export async function resendOtpAction(model: MobileRequestModel) {
    const startTime = Date.now();
    log('info', 'resendOtpAction started', { mobile: model.mobile });
    
    try {
        const headersList = await headers();
        const userAgent = headersList.get('user-agent') || '';

        log('info', 'Preparing request to /auth/otp/send', {
            mobile: model.mobile,
        });

        const requestStartTime = Date.now();
        const response = await createData<{ mobile: string; userAgent: string }, SendVerificationCodeResponse>(
            '/auth/otp/send',
            { ...model, userAgent }
        );
        const requestDuration = Date.now() - requestStartTime;

        log('info', 'Request to /auth/otp/send completed successfully', {
            duration: `${requestDuration}ms`,
            responseMessage: response.message,
        });

        const totalDuration = Date.now() - startTime;
        log('info', 'resendOtpAction completed successfully', {
            totalDuration: `${totalDuration}ms`,
        });

        return { success: true, message: response.message };
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const axiosError = err as { message?: string; code?: string; response?: { data?: unknown; status?: number }; stack?: string };
        log('error', 'resendOtpAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: axiosError?.message,
                code: axiosError?.code,
                response: axiosError?.response?.data,
                status: axiosError?.response?.status,
                stack: axiosError?.stack,
            },
        });
        return { success: false, error: 'خطا در ارسال مجدد کد' };
    }
}

export async function signinAction(model: SignInModel) {
    const headersList = headers();
    const userAgent = (await headersList).get('user-agent');
    try {
        const response = await fetch(`https://general-api.classbon.com/api/identity/signin`, {
            method: 'POST',
            body: JSON.stringify({ ...model, userAgent }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const user = await response.json();
            await SetAuthCookieAction(user);
            return { success: true }
        }
        return { success: false, error: 'خطا در ورود' };
    } catch (err) {
        console.log(err);
        return { success: false, error: 'خطا در ورود' }
    }
}

export async function signOutAction() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ylawyer-session')?.value;

    if (!sessionCookie) {
        return null;
    }

    const session = await decryptSession(sessionCookie);
    try {
        const response = await createData<{ sessionId: string }, { success: boolean }>(
            '/auth/signout',
            { sessionId: (session as unknown as UserSession).sessionId }
        );

        if (response.success) {
            cookieStore.delete('ylawyer-session');
            return { isSuccess: true }
        }
    } catch {
        return { success: false };
    }
}

export async function SetAuthCookieAction(user: UserResponse) {
    const startTime = Date.now();
    log('info', 'SetAuthCookieAction started', {
        hasAccessToken: !!user?.accessToken,
        hasSessionId: !!user?.sessionId,
    });
    
    try {
        log('info', 'Decoding JWT token...');
        const decoded = jwtDecode<JWT>(user.accessToken);
        log('info', 'JWT decoded successfully', {
            userName: decoded.userName,
            exp: decoded.exp,
        });

        const session: UserSession = {
            userName: decoded.userName,
            fullName: decoded.fullName,
            pic: decoded.pic,
            exp: decoded.exp * 1000,
            accesstoken: user.accessToken,
            sessionId: user.sessionId,
            sessionExpiry: user.sessionExpiry * 1000
        };

        log('info', 'Session object created', {
            userName: session.userName,
            sessionId: session.sessionId,
            exp: new Date(session.exp).toISOString(),
        });

        const cookieStore = await cookies();
        
        log('info', 'Encrypting session...');
        const encryptStartTime = Date.now();
        const encryptedSession = await encryptSession(session);
        const encryptDuration = Date.now() - encryptStartTime;
        log('info', 'Session encrypted successfully', {
            duration: `${encryptDuration}ms`,
            encryptedLength: encryptedSession.length,
        });
        
        // Verify encryption (optional, for debugging)
        log('info', 'Verifying encryption...');
        const decryptedSession = await decryptSession(encryptedSession);
        const decryptedSessionTyped = decryptedSession as unknown as UserSession;
        log('info', 'Encryption verified', {
            decryptedUserName: decryptedSessionTyped?.userName,
        });
        
        log('info', 'Setting cookie...');
        cookieStore.set('ylawyer-session', encryptedSession, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        });
        
        const totalDuration = Date.now() - startTime;
        log('info', 'SetAuthCookieAction completed successfully', {
            totalDuration: `${totalDuration}ms`,
        });
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const error = err as { message?: string; stack?: string };
        log('error', 'SetAuthCookieAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: error?.message,
                stack: error?.stack,
            },
        });
        throw err;
    }
}