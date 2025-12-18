import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchConversationsFromAPI, createConversationInAPI } from "@/services/api";

export interface ChatMessage {
  id: string;
  type: "question" | "answer";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  messages: ChatMessage[];
  isSynced?: boolean; // نشان می‌دهد در بک‌اند ساخته شده است یا خیر
}
interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Actions
  createConversation: (title?: string) => Promise<string | null>;
  createLocalConversation: (title?: string) => string;
  ensureConversationSynced: (conversationId: string, title: string) => Promise<string | null>;
  setActiveConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  getActiveConversation: () => Conversation | null;
  getConversationById: (id: string) => Conversation | null;
  addMessageToConversation: (conversationId: string, message: ChatMessage) => void;
  getConversationMessages: (conversationId: string) => ChatMessage[];
  clearConversationMessages: (conversationId: string) => void;
  loadConversationsFromAPI: () => Promise<void>;
}

// Helper function to generate a title from first message
export const generateConversationTitle = (firstMessage: string): string => {
  if (!firstMessage) return "گفتگوی جدید";
  // Take first 50 characters and add ellipsis if longer
  const trimmed = firstMessage.trim();
  return trimmed.length > 50 ? trimmed.substring(0, 50) + "..." : trimmed;
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: async (title = "گفتگوی جدید") => {
        try {
          const apiResponse = await createConversationInAPI(title);
          
          if (apiResponse.id) {
            const newConversation: Conversation = {
              id: apiResponse.id,
              title: apiResponse.title || title,
              createdAt: new Date(apiResponse.created_at),
              updatedAt: new Date(apiResponse.updated_at),
              messageCount: apiResponse.message_count || 0,
              messages: [],
              isSynced: true,
            };

            set((state) => ({
              conversations: [newConversation, ...state.conversations],
              activeConversationId: apiResponse.id,
            }));

            return apiResponse.id;
          }

          console.warn("Failed to create conversation in API");
          return null;
        } catch (error) {
          console.error("Error creating conversation in API:", error);
          return null;
        }
      },

      createLocalConversation: (title = "گفتگوی جدید") => {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempConversation: Conversation = {
          id: tempId,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
          messages: [],
          isSynced: false,
        };

        set((state) => ({
          conversations: [tempConversation, ...state.conversations],
          activeConversationId: tempId,
        }));

        return tempId;
      },

      ensureConversationSynced: async (conversationId, title) => {
        const state = get();
        const conversation = state.conversations.find((c) => c.id === conversationId);
        if (!conversation) return null;
        if (conversation.isSynced) return conversation.id;

        try {
          const apiResponse = await createConversationInAPI(title || conversation.title || "گفتگوی جدید");
          if (!apiResponse.id) return conversationId;

          const newId = apiResponse.id;
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    id: newId,
                    title: apiResponse.title || title || conv.title,
                    createdAt: new Date(apiResponse.created_at),
                    updatedAt: new Date(apiResponse.updated_at),
                    isSynced: true,
                  }
                : conv
            ),
            activeConversationId: newId,
          }));

          return newId;
        } catch (error) {
          console.error("Failed to sync conversation:", error);
          return conversationId;
        }
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? { ...conv, ...updates, updatedAt: new Date() }
              : conv
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter(
            (conv) => conv.id !== id
          );
          const newActiveId =
            state.activeConversationId === id
              ? newConversations.length > 0
                ? newConversations[0].id
                : null
              : state.activeConversationId;

          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });
      },

      getActiveConversation: () => {
        const state = get();
        if (!state.activeConversationId) return null;
        return (
          state.conversations.find(
            (conv) => conv.id === state.activeConversationId
          ) || null
        );
      },

      getConversationById: (id) => {
        const state = get();
        return state.conversations.find((conv) => conv.id === id) || null;
      },

      addMessageToConversation: (conversationId, message) => {
        set((state) => {
          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const updatedMessages = [...conv.messages, message];
              // Update title if this is the first question
              let updatedTitle = conv.title;
              if (conv.messageCount === 0 && message.type === "question") {
                updatedTitle = generateConversationTitle(message.content);
              }
              return {
                ...conv,
                messages: updatedMessages,
                messageCount: updatedMessages.filter((m) => m.type === "question").length,
                title: updatedTitle,
                updatedAt: new Date(),
              };
            }
            return conv;
          });

          return { conversations: updatedConversations };
        });
      },

      getConversationMessages: (conversationId) => {
        const state = get();
        const conversation = state.conversations.find((conv) => conv.id === conversationId);
        return conversation?.messages || [];
      },

      clearConversationMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [], messageCount: 0, updatedAt: new Date() }
              : conv
          ),
        }));
      },

      loadConversationsFromAPI: async () => {
        try {
          const apiConversations = await fetchConversationsFromAPI();
          set((state) => {
            // جایگزین کردن گفتگوهای موجود با گفتگوهای API
            // گفتگوهای API اولویت دارند
            if (apiConversations.length > 0) {
              // اگر گفتگوی فعالی نداریم یا گفتگوی فعال در API نیست، اولین گفتگو را فعال کنیم
              const currentActiveExists = apiConversations.some(
                c => c.id === state.activeConversationId
              );
              const newActiveId = !state.activeConversationId || !currentActiveExists
                ? apiConversations[0].id
                : state.activeConversationId;

              return {
                conversations: apiConversations.map((c) => ({ ...c, isSynced: true })),
                activeConversationId: newActiveId,
              };
            }
            // اگر گفتگویی از API نیامد، state را تغییر نده
            return state;
          });
        } catch (error) {
          console.error("Failed to load conversations from API:", error);
        }
      },
    }),
    {
      name: "conversation-storage",
      // Custom storage with Date serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            if (parsed?.state?.conversations) {
              parsed.state.conversations = parsed.state.conversations.map((conv: {
                id: string;
                title: string;
                createdAt: string;
                updatedAt: string;
                messageCount: number;
                messages: Array<{
                  id: string;
                  type: string;
                  content: string;
                  timestamp: string;
                }>;
                isSynced?: boolean;
              }) => ({
                ...conv,
                createdAt: new Date(conv.createdAt),
                updatedAt: new Date(conv.updatedAt),
                messages: (conv.messages || []).map((msg) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                })),
                isSynced: conv.isSynced,
              }));
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = {
              ...value,
              state: {
                ...value.state,
                conversations: value.state.conversations.map((conv: Conversation) => ({
                  ...conv,
                  createdAt: conv.createdAt.toISOString(),
                  updatedAt: conv.updatedAt.toISOString(),
                  messages: conv.messages.map((msg: ChatMessage) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                  })),
                })),
              },
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          } catch (error) {
            console.error("Failed to save conversations:", error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

