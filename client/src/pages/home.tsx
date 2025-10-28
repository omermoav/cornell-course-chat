import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import SearchInput from "@/components/SearchInput";
import AnswerCard from "@/components/AnswerCard";
import StatusMessage from "@/components/StatusMessage";
import ThemeToggle from "@/components/ThemeToggle";
import { GraduationCap } from "lucide-react";
import type { AnswerResponse, ChatMessage } from "@shared/schema";

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; answer?: AnswerResponse }>>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const searchMutation = useMutation({
    mutationFn: async ({ question, conversationHistory }: { question: string; conversationHistory?: ChatMessage[] }) => {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, conversationHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as AnswerResponse;
    },
    onSuccess: (data, variables) => {
      // Add assistant's response to messages
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.aiAnswer || data.message || 'No response',
          answer: data,
        }
      ]);
    },
    onError: (error) => {
      console.error("Search error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Failed to connect to the server. Please try again later.",
          answer: {
            success: false,
            error: "Failed to connect to the server. Please try again later.",
          }
        }
      ]);
    },
  });

  const handleSearch = (query: string) => {
    console.log('Search triggered:', query);
    
    // Add to recent queries
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 5);
    });

    // Add user message to messages
    setMessages(prev => [
      ...prev,
      { role: 'user', content: query }
    ]);

    // Build conversation history from previous messages (excluding the one we just added)
    const conversationHistory: ChatMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: Date.now(),
    }));

    searchMutation.mutate({ question: query, conversationHistory });
  };

  const handleClearRecent = () => {
    setRecentQueries([]);
    console.log('Recent queries cleared');
  };

  const handleClearConversation = () => {
    setMessages([]);
    console.log('Conversation cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Gradient */}
      <header className="relative border-b overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-primary uppercase tracking-wider">Cornell University</div>
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Classes Q&A
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Ask natural-language questions about Cornell courses and get instant answers from the official Class Roster API
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="space-y-10">
          {/* Search Section */}
          <SearchInput 
            onSearch={handleSearch}
            isLoading={searchMutation.isPending}
            recentQueries={recentQueries}
            onClearRecent={handleClearRecent}
          />

          {/* Conversation Display */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Show empty state if no messages */}
            {messages.length === 0 && !searchMutation.isPending && (
              <StatusMessage type="empty" />
            )}

            {/* Display messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`space-y-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  /* User Message */
                  <div data-testid={`message-user-${idx}`} className="max-w-3xl rounded-2xl bg-primary/10 border border-primary/20 px-6 py-4">
                    <p className="text-base font-medium">{msg.content}</p>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div data-testid={`message-assistant-${idx}`} className="w-full space-y-4">
                    {/* Full Course Card */}
                    {msg.answer?.courseInfo && (
                      <AnswerCard
                        aiAnswer={msg.answer.aiAnswer}
                        courseInfo={msg.answer.courseInfo}
                        rosterSlug={msg.answer.rosterSlug!}
                        rosterDescr={msg.answer.rosterDescr!}
                        isOldData={msg.answer.isOldData}
                        classPageUrl={msg.answer.classPageUrl!}
                        answerType={msg.answer.answerType || "general"}
                      />
                    )}

                    {/* General Answer (no specific course) */}
                    {msg.answer?.success && msg.content && !msg.answer?.courseInfo && (
                      <div className="rounded-2xl border-2 border-border bg-gradient-to-br from-background via-background to-muted/20 shadow-xl p-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Answer</h3>
                          </div>
                          <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {/* Suggestions */}
                        {msg.answer.suggestions && msg.answer.suggestions.length > 0 && (
                          <div className="mt-6 space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground">
                              Try asking:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {msg.answer.suggestions.map((suggestion, sidx) => (
                                <button
                                  key={sidx}
                                  data-testid={`suggestion-${idx}-${sidx}`}
                                  onClick={() => handleSearch(suggestion)}
                                  className="text-left p-4 rounded-xl border-2 border-border bg-card hover-elevate active-elevate-2 transition-all"
                                >
                                  <p className="text-sm font-medium">{suggestion}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Messages */}
                    {msg.answer && !msg.answer.success && (
                      <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-6">
                        <p className="text-base text-destructive">{msg.answer.error || msg.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {searchMutation.isPending && (
              <StatusMessage type="loading" />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left space-y-1">
              <p className="text-sm font-medium text-foreground">
                Data from Cornell Class Roster API
              </p>
              <p className="text-xs text-muted-foreground">
                Rate limit: ≤1 request/second • All course data is official and up-to-date
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {messages.length > 0 && messages[messages.length - 1]?.answer?.rosterDescr && (
                <div className="px-3 py-1.5 rounded-full bg-muted/50">
                  {messages[messages.length - 1]?.answer?.rosterDescr}
                </div>
              )}
              {messages.length > 1 && (
                <button
                  onClick={handleClearConversation}
                  data-testid="button-clear-conversation"
                  className="px-3 py-1.5 rounded-full bg-muted/50 hover-elevate active-elevate-2 transition-all"
                >
                  Clear Conversation
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
