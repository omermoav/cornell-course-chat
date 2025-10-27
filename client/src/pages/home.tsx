import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import AnswerCard from "@/components/AnswerCard";
import StatusMessage from "@/components/StatusMessage";
import ThemeToggle from "@/components/ThemeToggle";
import { GraduationCap } from "lucide-react";

type SearchStatus = "idle" | "loading" | "success" | "error" | "notFound" | "passRatePolicy";

export default function Home() {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [currentQuery, setCurrentQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  //todo: remove mock functionality
  const mockCourseData = {
    subject: "NBAY",
    catalogNbr: "5500",
    titleLong: "Executive Leadership",
    gradingBasis: "Student Option",
    unitsMinimum: 3,
    unitsMaximum: 3,
    instructors: ["Jane Smith", "John Doe"],
    meetingPatterns: [
      { days: "MW", timeStart: "10:10am", timeEnd: "11:25am" },
      { days: "F", timeStart: "2:00pm", timeEnd: "3:15pm" }
    ],
    lastTermsOffered: "FA25, SP25, FA24, SP24"
  };

  const handleSearch = (query: string) => {
    console.log('Search triggered:', query);
    setCurrentQuery(query);
    setSearchStatus("loading");

    // Add to recent queries
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 5);
    });

    //todo: remove mock functionality - simulate API call
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      // Check for pass rate questions
      if (lowerQuery.includes("pass rate") || lowerQuery.includes("median grade") || lowerQuery.includes("grade distribution")) {
        setSearchStatus("passRatePolicy");
      }
      // Check for specific course codes in the mock
      else if (lowerQuery.includes("nbay 5500") || lowerQuery.includes("info 2950") || lowerQuery.includes("cs 4780")) {
        setSearchStatus("success");
      }
      // Simulate not found
      else if (lowerQuery.includes("xxxx 9999")) {
        setSearchStatus("notFound");
      }
      // Default to success for demo
      else {
        setSearchStatus("success");
      }
    }, 1200);
  };

  const handleClearRecent = () => {
    setRecentQueries([]);
    console.log('Recent queries cleared');
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
            isLoading={searchStatus === "loading"}
            recentQueries={recentQueries}
            onClearRecent={handleClearRecent}
          />

          {/* Results Section */}
          <div className="max-w-4xl mx-auto">
            {searchStatus === "idle" && (
              <StatusMessage type="empty" />
            )}

            {searchStatus === "loading" && (
              <StatusMessage type="loading" />
            )}

            {searchStatus === "error" && (
              <StatusMessage type="error" />
            )}

            {searchStatus === "notFound" && (
              <StatusMessage type="notFound" courseCode="XXXX 9999" />
            )}

            {searchStatus === "passRatePolicy" && (
              <StatusMessage 
                type="passRatePolicy"
                classPageUrl="https://classes.cornell.edu/browse/roster/FA25/class/ORIE/3500"
              />
            )}

            {searchStatus === "success" && (
              <AnswerCard
                courseInfo={mockCourseData}
                rosterSlug="FA25"
                rosterDescr="Fall 2025"
                classPageUrl="https://classes.cornell.edu/browse/roster/FA25/class/NBAY/5500"
                answerType={
                  currentQuery.toLowerCase().includes("pass") || currentQuery.toLowerCase().includes("grading") ? "grading" :
                  currentQuery.toLowerCase().includes("credit") ? "credits" :
                  currentQuery.toLowerCase().includes("instructor") || currentQuery.toLowerCase().includes("professor") ? "instructor" :
                  currentQuery.toLowerCase().includes("meet") || currentQuery.toLowerCase().includes("time") || currentQuery.toLowerCase().includes("schedule") ? "schedule" :
                  currentQuery.toLowerCase().includes("history") || currentQuery.toLowerCase().includes("last offered") ? "history" :
                  "general"
                }
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
              <div className="px-3 py-1.5 rounded-full bg-muted/50">
                Fall 2025 Roster
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
