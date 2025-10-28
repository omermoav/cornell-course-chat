import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import SearchInput from "@/components/SearchInput";
import AnswerCard from "@/components/AnswerCard";
import StatusMessage from "@/components/StatusMessage";
import ThemeToggle from "@/components/ThemeToggle";
import { GraduationCap } from "lucide-react";
import type { AnswerResponse } from "@shared/schema";

export default function Home() {
  const [currentAnswer, setCurrentAnswer] = useState<AnswerResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  const searchMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as AnswerResponse;
    },
    onSuccess: (data) => {
      setCurrentAnswer(data);
    },
    onError: (error) => {
      console.error("Search error:", error);
      setCurrentAnswer({
        success: false,
        error: "Failed to connect to the server. Please try again later.",
      });
    },
  });

  const handleSearch = (query: string) => {
    console.log('Search triggered:', query);
    
    // Add to recent queries
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 5);
    });

    searchMutation.mutate(query);
  };

  const handleClearRecent = () => {
    setRecentQueries([]);
    console.log('Recent queries cleared');
  };

  const getStatusType = () => {
    if (searchMutation.isPending) return "loading";
    if (!currentAnswer) return "idle";
    
    if (currentAnswer.success && currentAnswer.courseInfo) {
      return "success";
    }
    
    if (currentAnswer.message?.includes("pass rates")) {
      return "passRatePolicy";
    }
    
    if (currentAnswer.error?.includes("No roster history")) {
      return "notFound";
    }
    
    if (!currentAnswer.success) {
      return "error";
    }
    
    return "idle";
  };

  const status = getStatusType();

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

          {/* Results Section */}
          <div className="max-w-4xl mx-auto">
            {status === "idle" && (
              <StatusMessage type="empty" />
            )}

            {status === "loading" && (
              <StatusMessage type="loading" />
            )}

            {status === "error" && currentAnswer && (
              <StatusMessage 
                type="error" 
                message={currentAnswer.error}
              />
            )}

            {status === "notFound" && currentAnswer && (
              <StatusMessage 
                type="notFound" 
                courseCode={currentAnswer.error?.match(/for ([A-Z]+ \d+)/)?.[1] || ""}
              />
            )}

            {status === "passRatePolicy" && currentAnswer && (
              <StatusMessage 
                type="passRatePolicy"
                classPageUrl={currentAnswer.classPageUrl}
              />
            )}

            {status === "success" && currentAnswer?.courseInfo && (
              <AnswerCard
                aiAnswer={currentAnswer.aiAnswer}
                courseInfo={currentAnswer.courseInfo}
                rosterSlug={currentAnswer.rosterSlug!}
                rosterDescr={currentAnswer.rosterDescr!}
                isOldData={currentAnswer.isOldData}
                classPageUrl={currentAnswer.classPageUrl!}
                answerType={currentAnswer.answerType || "general"}
              />
            )}
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
              {currentAnswer?.rosterDescr && (
                <div className="px-3 py-1.5 rounded-full bg-muted/50">
                  {currentAnswer.rosterDescr}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
