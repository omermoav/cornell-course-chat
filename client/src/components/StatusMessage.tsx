import { AlertCircle, Info, Loader2, Search, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type StatusType = "loading" | "error" | "notFound" | "passRatePolicy" | "empty";

interface StatusMessageProps {
  type: StatusType;
  message?: string;
  courseCode?: string;
  classPageUrl?: string;
}

export default function StatusMessage({ 
  type, 
  message,
  courseCode,
  classPageUrl 
}: StatusMessageProps) {
  if (type === "loading") {
    return (
      <Card data-testid="status-loading" className="shadow-lg border-2 overflow-hidden">
        <CardContent className="py-16">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold">Searching Cornell Class Roster...</p>
              <p className="text-sm text-muted-foreground">Fetching the latest course information</p>
            </div>
            {/* Skeleton preview */}
            <div className="w-full max-w-md space-y-3 mt-4">
              <div className="h-4 skeleton rounded" />
              <div className="h-4 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-5/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "error") {
    return (
      <Card data-testid="status-error" className="shadow-lg border-2 border-destructive/50 overflow-hidden">
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="font-semibold text-lg text-destructive">Connection Error</div>
          </div>
        </div>
        <CardContent className="py-6">
          <p className="text-base leading-relaxed">
            {message || "Unable to connect to the Cornell Class Roster API. Please check your connection and try again later."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (type === "notFound") {
    return (
      <Card data-testid="status-not-found" className="shadow-lg border-2 overflow-hidden">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6 text-center max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-muted/50 rounded-full blur-2xl" />
              <div className="relative p-6 rounded-full bg-muted/30">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold">No roster history found</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                No roster history found for <span className="font-mono font-bold text-foreground">{courseCode}</span>. 
                This may be a new course or there's no public data yet.
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg">
              Try searching for a different course code or check the spelling
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "passRatePolicy") {
    return (
      <Card data-testid="status-policy" className="shadow-lg border-2 border-primary/50 overflow-hidden">
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="font-semibold text-lg text-primary">Pass Rate Information Policy</div>
          </div>
        </div>
        <CardContent className="py-6 space-y-4">
          <p className="text-base leading-relaxed">
            Cornell does not publish current pass rates or median grades via the Class Roster. 
            I can share the grading basis and link to the official class page.
          </p>
          {classPageUrl && (
            <Button
              data-testid="button-view-class-policy"
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a href={classPageUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Class Page
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // empty state
  return (
    <div data-testid="status-empty" className="py-16 space-y-6 text-center animate-fade-in">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-8 rounded-full bg-gradient-to-br from-muted/50 to-muted/30">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-3 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-2xl font-bold">Search Cornell Classes</h3>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-base text-muted-foreground leading-relaxed">
          Get instant answers about grading, credits, schedules, and more from the official Cornell Class Roster
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
        <span className="px-3 py-1 rounded-full bg-muted/50">Pass/Fail Options</span>
        <span className="px-3 py-1 rounded-full bg-muted/50">Credit Hours</span>
        <span className="px-3 py-1 rounded-full bg-muted/50">Meeting Times</span>
        <span className="px-3 py-1 rounded-full bg-muted/50">Instructors</span>
      </div>
    </div>
  );
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
