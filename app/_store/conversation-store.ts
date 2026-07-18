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

const toValidDate = (value: Date | string | number | null | undefined): Date => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value != null) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
};

const toISOStringSafe = (value: Date | string | number | null | undefined): string =>
  toValidDate(value).toISOString();

const toConversationId = (id: string | number | null | undefined): string =>
  id == null ? "" : String(id);

const isTempConversationId = (id: string | number | null | undefined): boolean =>
  toConversationId(id).startsWith("temp_");

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
            const newId = toConversationId(apiResponse.id);
            const newConversation: Conversation = {
              id: newId,
              title: apiResponse.title || title,
              createdAt: toValidDate(apiResponse.created_at),
              updatedAt: toValidDate(apiResponse.updated_at),
              messageCount: apiResponse.message_count || 0,
              messages: [],
              isSynced: true,
            };

            set((state) => ({
              conversations: [newConversation, ...state.conversations],
              activeConversationId: newId,
            }));

            return newId;
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
        if (conversation.isSynced && !isTempConversationId(conversationId)) {
          return toConversationId(conversation.id);
        }

        try {
          const apiResponse = await createConversationInAPI(title || conversation.title || "گفتگوی جدید");
          if (!apiResponse.id) return null;

          const newId = toConversationId(apiResponse.id);
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    id: newId,
                    title: apiResponse.title || title || conv.title,
                    createdAt: toValidDate(apiResponse.created_at),
                    updatedAt: toValidDate(apiResponse.updated_at),
                    isSynced: true,
                  }
                : conv
            ),
            activeConversationId: newId,
          }));

          return newId;
        } catch (error) {
          console.error("Failed to sync conversation:", error);
          return null;
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
          const apiConversations = (await fetchConversationsFromAPI()).map((c) => ({
            ...c,
            id: toConversationId(c.id),
          }));
          set((state) => {
            const apiIds = new Set(apiConversations.map((c) => c.id));
            const localUnsynced = state.conversations.filter(
              (c) => isTempConversationId(c.id) || !c.isSynced
            );

            if (apiConversations.length > 0) {
              const merged = [
                ...apiConversations.map((c) => ({ ...c, isSynced: true as const })),
                ...localUnsynced.filter((c) => !apiIds.has(c.id)),
              ];
              const currentActiveExists = merged.some(
                (c) => c.id === state.activeConversationId
              );
              const newActiveId =
                !state.activeConversationId || !currentActiveExists
                  ? merged[0]?.id ?? null
                  : state.activeConversationId;

              return {
                conversations: merged,
                activeConversationId: newActiveId,
              };
            }

            // API empty: drop stale synced conversations from localStorage
            const activeStillValid = localUnsynced.some(
              (c) => c.id === state.activeConversationId
            );
            return {
              conversations: localUnsynced,
              activeConversationId: activeStillValid
                ? state.activeConversationId
                : localUnsynced[0]?.id ?? null,
            };
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
                id: toConversationId(conv.id),
                createdAt: toValidDate(conv.createdAt),
                updatedAt: toValidDate(conv.updatedAt),
                messages: (conv.messages || []).map((msg) => ({
                  ...msg,
                  id: toConversationId(msg.id),
                  timestamp: toValidDate(msg.timestamp),
                })),
                isSynced: conv.isSynced,
              }));
            }
            if (parsed?.state?.activeConversationId != null) {
              parsed.state.activeConversationId = toConversationId(
                parsed.state.activeConversationId
              );
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
                  createdAt: toISOStringSafe(conv.createdAt),
                  updatedAt: toISOStringSafe(conv.updatedAt),
                  messages: conv.messages?.map((msg: ChatMessage) => ({
                    ...msg,
                    timestamp: toISOStringSafe(msg.timestamp),
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

