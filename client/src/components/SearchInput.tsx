import { useState } from "react";
import { Search, Clock, X } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const exampleQuestions = [
    "Is NBAY 5500 pass/fail?",
    "Credits for INFO 2950?",
    "Open syllabus for CS 4780",
    "When does ORIE 3500 meet?"
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
          <Input
            data-testid="input-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about any Cornell class... (e.g., 'Is NBAY 5500 pass/fail?')"
            className="h-16 md:h-20 pl-14 pr-36 text-base md:text-lg rounded-xl shadow-lg border-2 transition-all focus:shadow-xl"
            disabled={isLoading}
          />
          <Button
            data-testid="button-search"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 md:h-12 px-6 rounded-lg font-medium"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse">Searching</span>
                <span className="ml-1 animate-pulse">...</span>
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Recent Searches</span>
            </div>
            {onClearRecent && (
              <Button
                data-testid="button-clear-recent"
                variant="ghost"
                size="sm"
                onClick={onClearRecent}
                className="h-7 text-xs"
              >
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
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border text-sm hover-elevate active-elevate-2 transition-smooth"
              >
                <span className="text-card-foreground">{recentQuery}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Example Questions */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground text-center">
          Try these examples:
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {exampleQuestions.map((question, idx) => (
            <Badge
              key={idx}
              data-testid={`button-example-${idx}`}
              variant="secondary"
              className="cursor-pointer px-3 py-1.5 text-xs md:text-sm hover-elevate active-elevate-2 transition-smooth"
              onClick={() => {
                setQuery(question);
              }}
            >
              {question}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
