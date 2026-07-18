export interface AskQuestionResponse {
    answer: string;
    sources: string[];
    conversation_id?: string | number;
    response_time_seconds: number;
    citation_count: number;
    citation_accuracy: number;
    domain: string;
    domain_label: string;
    domain_confidence: number;
  }
  
  export interface ConversationResponse {
    /** Backend sends int; normalize to string in API actions. */
    id: string | number;
    title: string;
    created_at: string;
    updated_at?: string;
    message_count?: number;
  }