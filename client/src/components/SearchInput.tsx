import { useState, useRef, useEffect } from "react";
import { Search, Clock, X, Sparkles, BookOpen, Calendar, GraduationCap, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  recentQueries?: string[];
  onClearRecent?: () => void;
}

export default function SearchInput({ 
  onSearch, 
  isLoading = false,
  recentQueries = [],
  onClearRecent
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const exampleQuestions = [
    { icon: Sparkles, text: "What is NBAY 6170?", category: "overview" },
    { icon: GraduationCap, text: "Is CS 4780 pass/fail?", category: "grading" },
    { icon: Calendar, text: "When does INFO 2950 meet?", category: "schedule" },
    { icon: BookOpen, text: "Prerequisites for ORIE 3500?", category: "requirements" },
    { icon: FileText, text: "Learning outcomes for TECH 5100?", category: "outcomes" }
  ];

  const placeholderText = isFocused 
    ? "Try: 'What is NBAY 6170?' or 'Is CS 4780 pass/fail?'" 
    : "Ask about any Cornell class...";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          relative transition-all duration-300 
          ${isFocused ? 'scale-[1.01]' : ''}
        `}>
          {/* Animated gradient border effect */}
          <div className={`
            absolute inset-0 rounded-2xl transition-opacity duration-300
            bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl
            ${isFocused ? 'opacity-100' : 'opacity-0'}
          `} />
          
          <div className="relative bg-background rounded-2xl shadow-2xl border-2 border-border">
            <Search 
              className={`
                absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 transition-all duration-300
                ${isFocused ? 'text-primary scale-110' : 'text-muted-foreground'}
              `} 
            />
            
            <Input
              ref={inputRef}
              data-testid="input-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholderText}
              className="
                h-20 pl-16 pr-40 text-lg rounded-2xl
                border-0 focus-visible:ring-0
                placeholder:text-muted-foreground/60
                transition-all duration-300
              "
              disabled={isLoading}
            />

            <Button
              data-testid="button-search"
              type="submit"
              size="icon"
              disabled={isLoading || !query.trim()}
              className="
                absolute right-3 top-1/2 -translate-y-1/2 
                h-12 w-12 rounded-full
                disabled:opacity-40
              "
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Search hints */}
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            Search by course code <span className="text-foreground font-medium">(NBAY 6170)</span> or 
            course name <span className="text-foreground font-medium">("Designing & Building AI")</span>
          </p>
        </div>
      </form>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Recent Searches</span>
            </div>
            {onClearRecent && (
              <Button
                data-testid="button-clear-recent"
                variant="ghost"
                size="sm"
                onClick={onClearRecent}
                className="h-8 text-xs hover-elevate"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {recentQueries.slice(0, 5).map((recentQuery, idx) => (
              <button
                key={idx}
                data-testid={`button-recent-${idx}`}
                onClick={() => {
                  setQuery(recentQuery);
                  onSearch(recentQuery);
                }}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-xl 
                  bg-card border-2 border-border text-sm font-medium
                  hover-elevate active-elevate-2 transition-all
                  group
                "
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-card-foreground">{recentQuery}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Example Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Example Questions</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exampleQuestions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                data-testid={`button-example-${idx}`}
                onClick={() => {
                  setQuery(item.text);
                  inputRef.current?.focus();
                }}
                className="
                  flex items-center gap-3 p-4 rounded-xl 
                  bg-card border-2 border-border
                  text-left text-sm font-medium
                  hover-elevate active-elevate-2 transition-all
                  group
                "
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
