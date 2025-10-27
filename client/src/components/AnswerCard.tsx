import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProvenanceBadge from "./ProvenanceBadge";

interface CourseInfo {
  subject: string;
  catalogNbr: string;
  titleLong: string;
  gradingBasis?: string;
  gradingBasisVariations?: string[];
  unitsMinimum?: number;
  unitsMaximum?: number;
  instructors?: string[];
  meetingPatterns?: Array<{ days: string; timeStart: string; timeEnd: string }>;
  lastTermsOffered?: string;
}

interface AnswerCardProps {
  courseInfo: CourseInfo;
  rosterSlug: string;
  rosterDescr: string;
  isOldData?: boolean;
  classPageUrl: string;
  answerType: "grading" | "credits" | "instructor" | "schedule" | "history" | "general";
}

export default function AnswerCard({
  courseInfo,
  rosterSlug,
  rosterDescr,
  isOldData = false,
  classPageUrl,
  answerType
}: AnswerCardProps) {
  const formatGradingBasis = (basis?: string) => {
    if (!basis) return "Not specified";
    if (basis === "Student Option") return "Student Option (Letter or S/U)";
    if (basis.includes("S/U") || basis.includes("Satisfactory/Unsatisfactory")) return "S/U only";
    if (basis === "Letter" && !basis.includes("Option")) return "Letter only";
    return basis;
  };

  return (
    <Card data-testid="card-answer" className="shadow-md">
      <CardHeader className="space-y-3">
        {isOldData && (
          <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-md">
            Note: Using the most recent available data ({rosterDescr})
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="space-y-2">
            <div className="font-mono text-lg md:text-xl font-semibold text-primary" data-testid="text-course-code">
              {courseInfo.subject} {courseInfo.catalogNbr}
            </div>
            <h2 className="text-xl md:text-2xl font-semibold" data-testid="text-course-title">
              {courseInfo.titleLong}
            </h2>
          </div>
          <ProvenanceBadge 
            rosterSlug={rosterSlug} 
            rosterDescr={rosterDescr}
            isOldData={isOldData}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {(answerType === "grading" || answerType === "general") && (
            <div className="space-y-1">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Grading Basis
              </div>
              {courseInfo.gradingBasisVariations && courseInfo.gradingBasisVariations.length > 1 ? (
                <div className="space-y-2">
                  <div className="text-base md:text-lg font-semibold" data-testid="text-grading-basis">
                    Varies by section
                  </div>
                  <ul className="space-y-1 text-sm">
                    {courseInfo.gradingBasisVariations.map((basis, idx) => (
                      <li key={idx} className="font-mono">{formatGradingBasis(basis)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-base md:text-lg font-semibold" data-testid="text-grading-basis">
                  {formatGradingBasis(courseInfo.gradingBasis)}
                </div>
              )}
            </div>
          )}

          {(answerType === "credits" || answerType === "general") && courseInfo.unitsMinimum !== undefined && (
            <div className="space-y-1">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Credits
              </div>
              <div className="text-base md:text-lg font-semibold" data-testid="text-credits">
                {courseInfo.unitsMinimum === courseInfo.unitsMaximum 
                  ? `${courseInfo.unitsMinimum} credit${courseInfo.unitsMinimum !== 1 ? 's' : ''}`
                  : `${courseInfo.unitsMinimum}–${courseInfo.unitsMaximum} credits`
                }
              </div>
            </div>
          )}

          {(answerType === "instructor" || answerType === "general") && courseInfo.instructors && courseInfo.instructors.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Instructor{courseInfo.instructors.length > 1 ? 's' : ''}
              </div>
              <div className="text-base md:text-lg" data-testid="text-instructors">
                {courseInfo.instructors.join(", ")}
              </div>
            </div>
          )}

          {(answerType === "schedule" || answerType === "general") && courseInfo.meetingPatterns && courseInfo.meetingPatterns.length > 0 && (
            <div className="space-y-1">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Meeting Times
              </div>
              <div className="space-y-1" data-testid="text-schedule">
                {courseInfo.meetingPatterns.map((pattern, idx) => (
                  <div key={idx} className="text-base">
                    <span className="font-medium">{pattern.days}</span>{" "}
                    {pattern.timeStart} – {pattern.timeEnd}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(answerType === "history" || answerType === "general") && courseInfo.lastTermsOffered && (
            <div className="space-y-1 md:col-span-2">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Last Terms Offered
              </div>
              <div className="text-base md:text-lg" data-testid="text-last-terms">
                {courseInfo.lastTermsOffered}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
          <Button
            data-testid="button-view-class"
            asChild
            className="flex-1 sm:flex-initial"
          >
            <a href={classPageUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Class Page
            </a>
          </Button>
          <Button
            data-testid="button-view-syllabus"
            variant="outline"
            asChild
            className="flex-1 sm:flex-initial"
          >
            <a href={classPageUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Syllabus (NetID Required)
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
