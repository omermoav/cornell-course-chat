import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import SearchInput from "@/components/SearchInput";
import AnswerCard from "@/components/AnswerCard";
import StatusMessage from "@/components/StatusMessage";
import ThemeToggle from "@/components/ThemeToggle";
import FeedbackButtons from "@/components/FeedbackButtons";
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
      {/* Cornell Tech Style Header */}
      <header className="relative flex-shrink-0 bg-white dark:bg-gray-900 border-b-4 border-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              {/* Official Cornell Tech Logo */}
              <img 
                src="/cornell-tech.svg" 
                alt="Cornell Tech Logo" 
                className="h-14 w-14 flex-shrink-0"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
                  Cornell Tech
                </h1>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide">
                  CLASSES Q&A
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Conversation Display */}
          <div className="max-w-4xl mx-auto space-y-4 pb-4">
            {/* Show empty state if no messages */}
            {messages.length === 0 && !searchMutation.isPending && (
              <StatusMessage type="empty" />
            )}

            {/* Display messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`space-y-4 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  /* User Message - Cornell Tech Style */
                  <div data-testid={`message-user-${idx}`} className="max-w-3xl rounded-xl bg-primary text-white px-6 py-4 shadow-md">
                    <p className="text-base font-medium">{msg.content}</p>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div data-testid={`message-assistant-${idx}`} className="w-full space-y-4">
                    {/* Full Course Card */}
                    {msg.answer?.courseInfo && (
                      <div className="space-y-2">
                        <AnswerCard
                          aiAnswer={msg.answer.aiAnswer}
                          courseInfo={msg.answer.courseInfo}
                          rosterSlug={msg.answer.rosterSlug!}
                          rosterDescr={msg.answer.rosterDescr!}
                          isOldData={msg.answer.isOldData}
                          classPageUrl={msg.answer.classPageUrl!}
                          answerType={msg.answer.answerType || "general"}
                        />
                        <FeedbackButtons messageContent={msg.content} />
                      </div>
                    )}

                    {/* General Answer (no specific course) - Cornell Tech Style */}
                    {msg.answer?.success && msg.content && !msg.answer?.courseInfo && (
                      <div className="space-y-4">
                        <div className="rounded border-4 border-primary bg-white dark:bg-gray-900 shadow-lg p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-primary" />
                              </div>
                              <h3 className="text-lg font-bold text-primary">Answer</h3>
                            </div>
                            <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300">{msg.content}</p>
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
                                    className="text-left p-4 rounded border-4 border-border bg-card hover-elevate active-elevate-2 transition-all"
                                  >
                                    <p className="text-sm font-medium">{suggestion}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Course List (if present) - Cornell Tech Style */}
                        {msg.answer.courseList && msg.answer.courseList.length > 0 && (
                          <div className="rounded border-4 border-primary bg-white dark:bg-gray-900 shadow-lg p-6">
                            <h4 className="text-lg font-bold text-primary mb-4">Available Courses ({msg.answer.courseList.length})</h4>
                            <div className="grid gap-3">
                              {msg.answer.courseList.map((course, cidx) => (
                                <button
                                  key={cidx}
                                  onClick={() => handleSearch(`What is ${course.subject} ${course.catalogNbr}?`)}
                                  className="text-left p-4 rounded border-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-primary hover:bg-primary/5 transition-all group"
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
                        
                        <FeedbackButtons messageContent={msg.content} />
                      </div>
                    )}

                    {/* Error Messages */}
                    {msg.answer && !msg.answer.success && (
                      <div className="rounded border-4 border-destructive/50 bg-destructive/10 p-6">
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
