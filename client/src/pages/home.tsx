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
    <div className="flex flex-col h-screen bg-background">
      {/* Hero Header with Gradient */}
      <header className="relative border-b overflow-hidden flex-shrink-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div>
                <div className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">Cornell University</div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Classes Q&A
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Ask natural-language questions about Cornell courses
          </p>
        </div>
      </header>

      {/* Main Content - Scrollable Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Conversation Display */}
          <div className="max-w-4xl mx-auto space-y-6 pb-6">
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
                      <div className="space-y-4">
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

                        {/* Course List (if present) */}
                        {msg.answer.courseList && msg.answer.courseList.length > 0 && (
                          <div className="rounded-2xl border-2 border-border bg-card p-6">
                            <h4 className="text-lg font-semibold mb-4">Available Courses ({msg.answer.courseList.length})</h4>
                            <div className="grid gap-3">
                              {msg.answer.courseList.map((course, cidx) => (
                                <button
                                  key={cidx}
                                  onClick={() => handleSearch(`What is ${course.subject} ${course.catalogNbr}?`)}
                                  className="text-left p-4 rounded-xl border border-border bg-background hover-elevate active-elevate-2 transition-all group"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-semibold text-primary">
                                          {course.subject} {course.catalogNbr}
                                        </span>
                                        {course.unitsMinimum && (
                                          <span className="text-xs text-muted-foreground">
                                            {course.unitsMinimum === course.unitsMaximum 
                                              ? `${course.unitsMinimum} credit${course.unitsMinimum !== 1 ? 's' : ''}`
                                              : `${course.unitsMinimum}-${course.unitsMaximum} credits`
                                            }
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                        {course.titleLong}
                                      </p>
                                    </div>
                                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                      →
                                    </div>
                                  </div>
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

      {/* Sticky Search Input at Bottom */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <SearchInput 
              onSearch={handleSearch}
              isLoading={searchMutation.isPending}
              recentQueries={recentQueries}
              onClearRecent={handleClearRecent}
              compact={messages.length > 0}
            />
            
            {/* Footer Info */}
            {messages.length === 0 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Data from Cornell Class Roster API • Rate limit: ≤1 request/second
                </p>
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div>
                  {messages[messages.length - 1]?.answer?.rosterDescr && (
                    <span className="px-3 py-1.5 rounded-full bg-muted/50">
                      {messages[messages.length - 1]?.answer?.rosterDescr}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearConversation}
                  data-testid="button-clear-conversation"
                  className="px-3 py-1.5 rounded-full bg-muted/50 hover-elevate active-elevate-2 transition-all"
                >
                  Clear Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
