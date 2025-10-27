import { AlertCircle, Info, Loader2, Search } from "lucide-react";
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
      <Card data-testid="status-loading" className="shadow-md">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-base text-muted-foreground">Searching Cornell Class Roster...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "error") {
    return (
      <Card data-testid="status-error" className="shadow-md border-l-4 border-l-destructive">
        <CardContent className="py-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-destructive">Error</div>
              <p className="text-sm md:text-base leading-relaxed">
                {message || "Unable to connect to the Cornell Class Roster API. Please try again later."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "notFound") {
    return (
      <Card data-testid="status-not-found" className="shadow-md">
        <CardContent className="py-6">
          <div className="flex gap-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-semibold">No roster history found</div>
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                No roster history found for <span className="font-mono font-semibold">{courseCode}</span>. 
                This may be a new course or there's no public data yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "passRatePolicy") {
    return (
      <Card data-testid="status-policy" className="shadow-md border-l-4 border-l-primary">
        <CardContent className="py-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <div className="font-semibold text-primary">Pass Rate Information Policy</div>
              <p className="text-sm md:text-base leading-relaxed">
                Cornell does not publish current pass rates or median grades via the Class Roster. 
                I can share the grading basis and link to the official class page.
              </p>
              {classPageUrl && (
                <Button
                  data-testid="button-view-class-policy"
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <a href={classPageUrl} target="_blank" rel="noopener noreferrer">
                    View Class Page
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // empty state
  return (
    <div data-testid="status-empty" className="text-center py-12 space-y-3">
      <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
      <p className="text-base md:text-lg text-muted-foreground">
        Search for any Cornell class to get started
      </p>
    </div>
  );
}
