// Log environment variables at module load for debugging
if (typeof window === 'undefined') {
    console.log('[CONFIG] Environment variables:', {
        API_URL: process.env.API_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV,
        hasAPI_URL: !!process.env.API_URL,
        hasNEXT_PUBLIC_API_URL: !!process.env.NEXT_PUBLIC_API_URL,
    });
}

export const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

// Warn if API_URL is not set
if (!API_URL && typeof window === 'undefined') {
    console.warn('[CONFIG] WARNING: API_URL is not set! This will cause connection issues.');
}

export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
