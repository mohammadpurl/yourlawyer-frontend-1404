'use server';

import { getSession } from "@/app/utils/session";
import { createDataWithAuth, readDataWithAuth } from "@/app/core/http-service/http-service";
import { AskQuestionResponse, ConversationResponse } from "@/types/api.interfaces";
import { Conversation } from "@/app/_store/conversation-store";

// Helper function for structured logging
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[API-ACTION] [${timestamp}] [${level.toUpperCase()}] ${message}`, logData || '');
};

export async function askUserQuestionAction(
    message: string,
    conversationId?: string
): Promise<AskQuestionResponse> {
    const startTime = Date.now();
    log('info', 'askUserQuestionAction started', { 
        messageLength: message.length,
        conversationId 
    });
    
    try {
        const session = await getSession();
        if (!session) {
            log('error', 'askUserQuestionAction failed - no session');
            throw new Error('Unauthorized - Please login first');
        }
        
        const requestBody: {
            question: string;
            conversation_id?: string;
            top_k: number;
            use_enhanced_retrieval: boolean;
        } = {
            question: message,
            top_k: 5,
            use_enhanced_retrieval: true,
        };

        if (conversationId) {
            requestBody.conversation_id = conversationId;
        }

        log('info', 'Calling /rag/ask API', {
            hasConversationId: !!conversationId,
        });

        const requestStartTime = Date.now();
        const response = await createDataWithAuth<typeof requestBody, AskQuestionResponse>(
            '/rag/ask',
            requestBody
        );
        const requestDuration = Date.now() - requestStartTime;

        log('info', 'askUserQuestionAction completed successfully', {
            duration: `${requestDuration}ms`,
            hasAnswer: !!response?.answer,
        });

        const totalDuration = Date.now() - startTime;
        log('info', 'askUserQuestionAction total duration', {
            totalDuration: `${totalDuration}ms`,
        });

        return response;
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const error = err as { message?: string; response?: { data?: unknown; status?: number } };
        log('error', 'askUserQuestionAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            },
        });
        throw err;
    }
}

export async function createConversationInAPIAction(
    title: string
): Promise<ConversationResponse> {
    const startTime = Date.now();
    log('info', 'createConversationInAPIAction started', { title });
    
    try {
        const session = await getSession();
        if (!session) {
            log('error', 'createConversationInAPIAction failed - no session');
            throw new Error('Unauthorized - Please login first');
        }

        log('info', 'Calling /conversations API (POST)');

        const requestStartTime = Date.now();
        const response = await createDataWithAuth<{ title: string }, ConversationResponse>(
            '/conversations',
            { title }
        );
        const requestDuration = Date.now() - requestStartTime;

        log('info', 'createConversationInAPIAction completed successfully', {
            duration: `${requestDuration}ms`,
            conversationId: response?.id,
        });

        const totalDuration = Date.now() - startTime;
        log('info', 'createConversationInAPIAction total duration', {
            totalDuration: `${totalDuration}ms`,
        });

        return response;
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const error = err as { message?: string; response?: { data?: unknown; status?: number } };
        log('error', 'createConversationInAPIAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            },
        });
        throw err;
    }
}

export async function fetchConversationsFromAPIAction(): Promise<Conversation[]> {
    const startTime = Date.now();
    log('info', 'fetchConversationsFromAPIAction started');
    
    try {
        const session = await getSession();
        if (!session) {
            log('warn', 'fetchConversationsFromAPIAction - no session, returning empty array');
            return [];
        }

        log('info', 'Calling /conversations API (GET)');

        const requestStartTime = Date.now();
        const data = await readDataWithAuth<ConversationResponse[]>(
            '/conversations'
        );
        const requestDuration = Date.now() - requestStartTime;

        log('info', 'fetchConversationsFromAPIAction completed successfully', {
            duration: `${requestDuration}ms`,
            count: data?.length || 0,
        });

        // تبدیل response API به format داخلی
        const conversations: Conversation[] = data.map((conv) => ({
            id: conv.id,
            title: conv.title || "گفتگوی جدید",
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            messageCount: conv.message_count || 0,
            messages: [], // پیام‌ها باید جداگانه دریافت شوند
        }));

        const totalDuration = Date.now() - startTime;
        log('info', 'fetchConversationsFromAPIAction total duration', {
            totalDuration: `${totalDuration}ms`,
        });

        return conversations;
    } catch (err: unknown) {
        const totalDuration = Date.now() - startTime;
        const error = err as { message?: string; response?: { data?: unknown; status?: number } };
        
        // اگر 401 بود، کاربر لاگین نیست - خالی برگردان
        if (error?.response?.status === 401) {
            log('warn', 'fetchConversationsFromAPIAction - unauthorized, returning empty array');
            return [];
        }

        log('error', 'fetchConversationsFromAPIAction failed', {
            totalDuration: `${totalDuration}ms`,
            error: {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            },
        });
        return [];
    }
}

