
import { notifyError } from "@/lib/notifier";
import { AskQuestionResponse, ConversationResponse } from "@/types/api.interfaces";
import { Conversation } from "@/app/_store/conversation-store";
import { useSessionStore } from "@/app/_store/auth-store";

/**
 * Helper function to get access token from session store
 * This works only on client-side
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const session = useSessionStore.getState().session;
  return session?.accesstoken || null;
}

/**
 * Helper function to get headers with authorization
 */
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}



export async function askUserQuestion(
  message: string,
  conversationId?: string
): Promise<AskQuestionResponse> {
  try {
    
    console.log(
      "process.env.NEXT_PUBLIC_API_URL",
      process.env.NEXT_PUBLIC_API_URL,
    );
    
    if (!process.env.NEXT_PUBLIC_API_URL) {
      notifyError("متغیر NEXT_PUBLIC_API_URL تنظیم نشده است", "پیکربندی نامعتبر");
      throw new Error("NEXT_PUBLIC_API_URL environment variable is not configured. Please set it in your .env.local file.");
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
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/rag/ask`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      notifyError("دریافت پاسخ از سرور ناموفق بود", "خطای سرور");
      // throw new Error("Failed to get response from backend");
      return {
        answer: "خطایی رخ داد",
        sources: [],
        response_time_seconds: 0,
        citation_count: 0,
        citation_accuracy: 0,
        domain: "",
        domain_label: "",
        domain_confidence: 0,
      };
    }
    const data = await response.json() as AskQuestionResponse;
    return data;
  } catch (error) {
    console.error("Error asking question:", error);
    notifyError(error instanceof Error ? error.message : "خطایی رخ داد", "خطا");
    return {
      answer: "خطایی رخ داد",
      sources: [],
      response_time_seconds: 0,
      citation_count: 0,
      citation_accuracy: 0,
      domain: "",
      domain_label: "",
      domain_confidence: 0,
    };
  }
}


export async function createConversationInAPI(title: string): Promise<ConversationResponse> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      notifyError("متغیر NEXT_PUBLIC_API_URL تنظیم نشده است", "پیکربندی نامعتبر");
      throw new Error("NEXT_PUBLIC_API_URL environment variable is not configured");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      notifyError("ایجاد گفتگو در سرور ناموفق بود", "خطای سرور");
      throw new Error("Failed to create conversation");
    }
    const data = await response.json() as ConversationResponse;
    return data;
  }
  catch (error) {
    console.error("Error creating conversation:", error);
    notifyError(error instanceof Error ? error.message : "خطایی رخ داد", "خطا");
    return {
      id: "",
      title: "",
      created_at: "",
      updated_at: "",
      message_count: 0,
    };
  }
}
export async function fetchConversationsFromAPI(): Promise<Conversation[]> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn("NEXT_PUBLIC_API_URL is not configured");
      return [];
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        // کاربر لاگین نیست
        return [];
      }
      console.error("Failed to fetch conversations:", response.statusText);
      return [];
    }

    const data = await response.json() as ConversationResponse[];
    
    // تبدیل response API به format داخلی
    return data.map((conv) => ({
      id: conv.id,
      title: conv.title || "گفتگوی جدید",
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      messageCount: conv.message_count || 0,
      messages: [], // پیام‌ها باید جداگانه دریافت شوند
    }));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}
