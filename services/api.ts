
import { notifyError } from "@/lib/notifier";
import { AskQuestionResponse, ConversationResponse } from "@/types/api.interfaces";
import { Conversation } from "@/app/_store/conversation-store";
import { 
  askUserQuestionAction, 
  createConversationInAPIAction, 
  fetchConversationsFromAPIAction 
} from "@/app/_actions/api-actions";

/**
 * Client-side wrapper for askUserQuestion server action
 * This function calls the server action which uses http-service.ts
 */
export async function askUserQuestion(
  message: string,
  conversationId?: string
): Promise<AskQuestionResponse> {
  try {
    const response = await askUserQuestionAction(message, conversationId);
    return response;
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


/**
 * Client-side wrapper for createConversationInAPI server action
 * This function calls the server action which uses http-service.ts
 */
export async function createConversationInAPI(title: string): Promise<ConversationResponse> {
  try {
    const response = await createConversationInAPIAction(title);
    return response;
  } catch (error) {
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
/**
 * Client-side wrapper for fetchConversationsFromAPI server action
 * This function calls the server action which uses http-service.ts
 */
export async function fetchConversationsFromAPI(): Promise<Conversation[]> {
  try {
    const conversations = await fetchConversationsFromAPIAction();
    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}
