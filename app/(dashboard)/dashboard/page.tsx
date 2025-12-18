"use client";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Scale, Send, Mic, MicOff, Plus, Trash2, Paperclip, Loader2 } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Input } from "@/app/components/ui/input";
import { askUserQuestion } from "@/services/api";
import { 
  useConversationStore, 
  ChatMessage,
  generateConversationTitle, 
} from "@/app/_store/conversation-store";
import { useSessionStore } from "@/app/_store/auth-store";
import { TopNavigationAccount } from "@/app/components/top-navigation-account";

const ensureDate = (value: Date | string | number | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions
) => {
  const date = ensureDate(value);
  return date ? date.toLocaleString("fa-IR", options) : "";
};

const formatTime = (value: Date | string | number | null | undefined) =>
  formatDateTime(value, { hour: "2-digit", minute: "2-digit" });

const formatDate = (value: Date | string | number | null | undefined) =>
  formatDateTime(value, { year: "numeric", month: "2-digit", day: "2-digit" });

const Dashboard = () => {
  const [question, setQuestion] = useState("");
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Session store
  const { status: authStatus } = useSessionStore();

  // Conversation store
  const {
    conversations,
    activeConversationId,
    createLocalConversation,
    ensureConversationSynced,
    setActiveConversation,
    deleteConversation,
    addMessageToConversation,
    getConversationMessages,
    loadConversationsFromAPI,
  } = useConversationStore();

  // Ensure we only render browser‑only features (speech, etc.) on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load messages for active conversation
  const activeMessages = activeConversationId 
    ? getConversationMessages(activeConversationId)
    : [];

  // Load conversations from API on mount if authenticated
  useEffect(() => {
    if (authStatus === 'authenticated' && conversations.length === 0) {
      loadConversationsFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // Set active conversation if exists
  useEffect(() => {
    if (conversations.length > 0) {
      if (!activeConversationId) {
        const firstConversation = conversations[0];
        if (firstConversation) {
          setActiveConversation(firstConversation.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, activeConversationId, authStatus]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
    const content = (question || transcript || "").trim();
    if (!content) return;

    // Ensure we have an active conversation
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const tempId = createLocalConversation("گفتگوی جدید");
      setActiveConversation(tempId);
      currentConversationId = tempId;
    }

    const newQuestion: ChatMessage = {
      id: Date.now().toString(),
      type: "question",
      content,
      timestamp: new Date(),
    };

    // Add question locally (updates title on first question)
    addMessageToConversation(currentConversationId, newQuestion);

    // Ensure conversation is created in backend with the generated title
    const titleForSync = generateConversationTitle(content);
    const syncedConversationId = await ensureConversationSynced(currentConversationId, titleForSync);
    if (!syncedConversationId) {
      toast({
        title: "خطا",
        description: "ایجاد گفتگو در سرور ناموفق بود",
      });
      return;
    }
    currentConversationId = syncedConversationId;
    setActiveConversation(currentConversationId);

    try { 
      const response = await askUserQuestion(content, currentConversationId);
      const answer: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "answer",
        content: response.answer,
        timestamp: new Date(),
      };
      addMessageToConversation(currentConversationId, answer);
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        title: "خطا",
        description: "دریافت پاسخ از سرور ناموفق بود",
      });
    }
    finally {
      setQuestion("");
      resetTranscript();
    }
  });
  };

  const handleNewChat = () => {
    const tempId = createLocalConversation("گفتگوی جدید");
    setActiveConversation(tempId);
    setQuestion("");
    resetTranscript();
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    toast({
      title: "گفتگو حذف شد",
      description: "گفتگو با موفقیت حذف شد",
    });
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      return;
    }

    toast({
      title: "فایل آپلود شد",
      description: `${files.length} فایل با موفقیت انتخاب شد`,
    });

    // Reset the input so the same file can be uploaded again if needed
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <TopNavigationAccount />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">گفتگوها</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNewChat}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    جدید
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      گفتگویی وجود ندارد
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                          activeConversationId === conv.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              activeConversationId === conv.id
                                ? "text-primary-foreground"
                                : ""
                            }`}>
                              {conv.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              activeConversationId === conv.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}>
                              {conv.messageCount} پیام • {formatDate(conv.updatedAt)}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-6 w-6 opacity-0 group-hover:opacity-100 ${
                              activeConversationId === conv.id
                                ? "hover:bg-primary-foreground/20"
                                : ""
                            }`}
                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  سوال حقوقی خود را بپرسید
                </CardTitle>
                <CardDescription>
                  سوالات خود را مطرح کنید و پاسخ تخصصی دریافت کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Messages */}
                <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  {activeMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>هنوز سوالی پرسیده نشده است</p>
                      <p className="text-sm mt-2">اولین سوال خود را بپرسید</p>
                    </div>
                  ) : (
                    activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.type === "question"
                            ? "bg-primary text-primary-foreground mr-auto max-w-[80%]"
                            : "bg-card border ml-auto max-w-[80%]"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-2 opacity-70">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Question Form */}
                <form onSubmit={handleSubmitQuestion} className="space-y-3">
                  <div className="relative">
                    <Textarea
                      placeholder="سوال حقوقی خود را اینجا بنویسید..."
                    value={question || transcript}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[100px] resize-none pr-20"
                    />
                    <div className="absolute left-2 top-2 flex gap-2">
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="آپلود فایل"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </label>
                      {isClient && isSupported && (
                        <Button
                          type="button"
                          variant={isListening ? "destructive" : "outline"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={toggleVoiceInput}
                          title={isListening ? "توقف ضبط" : "شروع ضبط صدا"}
                        >
                          {isListening ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary" disabled={isPending}>
                    <Send className="w-4 h-4 ml-2" />
                    {isPending ? 'در حال ارسال...' : 'ارسال سوال'}
                    {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
