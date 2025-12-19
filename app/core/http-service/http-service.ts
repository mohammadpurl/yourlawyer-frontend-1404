import { API_URL } from "@/configs/global";

import {
    ApiError,
} from "@/types/http-errors.interface";
import axios, {
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
} from "axios";
import { errorHandler, networkErrorStrategy } from "./http-error-strategies";

// Helper function for structured logging
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

// Log API_URL configuration at module load
log('info', '[HTTP-SERVICE] Initializing HTTP service', {
    API_URL: API_URL,
    hasAPI_URL: !!API_URL,
    type: typeof API_URL,
});

const httpService = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
    // Add these for better debugging
    validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Request interceptor for logging
httpService.interceptors.request.use(
    (config) => {
        log('info', `[HTTP REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            url: config.url,
            method: config.method,
            data: config.data,
            timeout: config.timeout,
            headers: config.headers,
        });
        return config;
    },
    (error) => {
        log('error', '[HTTP REQUEST ERROR]', {
            message: error.message,
            config: error.config,
        });
        return Promise.reject(error);
    }
);

httpService.interceptors.response.use(
    (response) => {
        log('info', `[HTTP RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
        });
        return response;
    },
    (error) => {
        if (error?.response) {
            const statusCode = error?.response?.status;
            log('error', `[HTTP RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: statusCode,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
            });
            if (statusCode >= 400) {
                const errorData: ApiError = error.response?.data;
                errorHandler[statusCode](errorData);
            }
        } else if (error?.request) {
            // Check if it's a timeout
            const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
            log('error', isTimeout ? '[HTTP TIMEOUT ERROR]' : '[HTTP NETWORK ERROR]', {
                message: error.message,
                code: error.code,
                isTimeout: isTimeout,
                requestMade: !!error.request,
                requestData: error.request ? {
                    responseURL: error.request.responseURL,
                    status: error.request.status,
                    statusText: error.request.statusText,
                } : null,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL,
                    fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
                    timeout: error.config?.timeout,
                    headers: error.config?.headers,
                },
            });
            networkErrorStrategy();
        } else {
            log('error', '[HTTP UNKNOWN ERROR]', {
                message: error.message,
                error: error,
            });
            networkErrorStrategy();
        }
        return Promise.reject(error);
    }
);

async function apiBase<T>(
    url: string,
    options?: AxiosRequestConfig
): Promise<T> {
    const startTime = Date.now();
    try {
        log('info', `[API_BASE] Starting request to ${url}`, {
            fullUrl: `${httpService.defaults.baseURL}${url}`,
            options: {
                method: options?.method || 'GET',
                timeout: options?.timeout || httpService.defaults.timeout,
            },
        });
        
        const response: AxiosResponse = await httpService(url, options);
        const duration = Date.now() - startTime;
        
        log('info', `[API_BASE] Request completed successfully in ${duration}ms`, {
            url,
            duration: `${duration}ms`,
            status: response.status,
        });
        
        return response.data as T;
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const axiosError = error as { 
            message?: string; 
            code?: string; 
            response?: { data?: unknown; status?: number; headers?: unknown }; 
            request?: unknown;
            config?: { baseURL?: string; url?: string; timeout?: number };
        };
        
        const isTimeout = axiosError?.code === 'ECONNABORTED' || 
                         axiosError?.message?.includes('timeout') ||
                         duration >= 29000; // Close to 30s timeout
        
        log('error', isTimeout ? `[API_BASE] Request TIMEOUT after ${duration}ms` : `[API_BASE] Request failed after ${duration}ms`, {
            url,
            fullURL: axiosError?.config?.baseURL ? `${axiosError.config.baseURL}${url}` : url,
            duration: `${duration}ms`,
            isTimeout: isTimeout,
            error: {
                message: axiosError?.message,
                code: axiosError?.code,
                hasResponse: !!axiosError?.response,
                hasRequest: !!axiosError?.request,
                response: axiosError?.response ? {
                    data: axiosError.response.data,
                    status: axiosError.response.status,
                    headers: axiosError.response.headers,
                } : null,
                config: axiosError?.config ? {
                    baseURL: axiosError.config.baseURL,
                    url: axiosError.config.url,
                    timeout: axiosError.config.timeout,
                } : null,
            },
        });
        throw error;
    }
}

async function readData<T>(
    url: string,
    headers?: AxiosRequestHeaders
): Promise<T> {
    const options: AxiosRequestConfig = {
        headers: headers,
        method: "GET",
    };
    return await apiBase<T>(url, options);
}

async function createData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "POST",
        headers: headers,
        data: data,
    };

    return await apiBase<TResult>(url, options);
}

async function updateData<TModel, TResult>(
    url: string,
    data: TModel,
    headers?: AxiosRequestHeaders
): Promise<TResult> {
    const options: AxiosRequestConfig = {
        method: "PUT",
        headers: headers,
        data: data,
    };

    return await apiBase<TResult>(url, options);
}

async function deleteData(
    url: string,
    headers?: AxiosRequestHeaders
): Promise<void> {
    const options: AxiosRequestConfig = {
        method: "DELETE",
        headers: headers,
    };

    return await apiBase(url, options);
}

export { createData, readData, updateData, deleteData };