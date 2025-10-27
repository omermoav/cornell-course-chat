import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchInput({ onSearch, isLoading = false }: SearchInputProps) {
  const [query, setQuery] = useState("");

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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            data-testid="input-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about any Cornell class... (e.g., 'Is NBAY 5500 pass/fail?')"
            className="h-14 md:h-16 pl-12 pr-32 text-base md:text-lg rounded-lg shadow-sm"
            disabled={isLoading}
          />
          <Button
            data-testid="button-search"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 md:h-12"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground">Try:</span>
        {exampleQuestions.map((question, idx) => (
          <button
            key={idx}
            data-testid={`button-example-${idx}`}
            onClick={() => setQuery(question)}
            className="text-xs md:text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground hover-elevate active-elevate-2 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
