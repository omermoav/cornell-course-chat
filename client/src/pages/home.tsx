import { useState } from "react";
import SearchInput from "@/components/SearchInput";
import AnswerCard from "@/components/AnswerCard";
import StatusMessage from "@/components/StatusMessage";

type SearchStatus = "idle" | "loading" | "success" | "error" | "notFound" | "passRatePolicy";

export default function Home() {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [currentQuery, setCurrentQuery] = useState("");

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
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold text-primary">Cornell University</div>
            <h1 className="text-3xl md:text-4xl font-bold">Classes Q&A</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Ask natural-language questions about Cornell courses
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="space-y-8">
          {/* Search Section */}
          <SearchInput 
            onSearch={handleSearch}
            isLoading={searchStatus === "loading"}
          />

          {/* Results Section */}
          <div>
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
      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Data from Cornell Class Roster API
          </p>
          <p className="text-xs text-muted-foreground">
            Rate limit: ≤1 request/second
          </p>
        </div>
      </footer>
    </div>
  );
}
