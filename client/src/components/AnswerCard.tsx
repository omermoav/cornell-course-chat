import { ExternalLink, BookOpen, Award, Users, Clock, Calendar, FileText, AlertCircle, CheckCircle, BookmarkCheck, Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProvenanceBadge from "./ProvenanceBadge";
import { Separator } from "@/components/ui/separator";
import type { QuestionIntent } from "@shared/schema";
import { formatGradingBasis } from "@shared/grading-utils";

interface CourseInfo {
  subject: string;
  catalogNbr: string;
  titleLong: string;
  description?: string;
  gradingBasis?: string;
  gradingBasisVariations?: string[];
  unitsMinimum?: number;
  unitsMaximum?: number;
  instructors?: string[];
  meetingPatterns?: Array<{ days: string; timeStart: string; timeEnd: string }>;
  prerequisites?: string;
  outcomes?: string;
  satisfiesRequirements?: string;
  breadthRequirements?: string;
  distributionCategories?: string;
  forbiddenOverlaps?: string[];
  permissionRequired?: string;
  lastTermsOffered?: string;
}

interface AnswerCardProps {
  aiAnswer?: string;
  courseInfo: CourseInfo;
  rosterSlug: string;
  rosterDescr: string;
  isOldData?: boolean;
  classPageUrl: string;
  answerType: QuestionIntent;
}

export default function AnswerCard({
  aiAnswer,
  courseInfo,
  rosterSlug,
  rosterDescr,
  isOldData = false,
  classPageUrl,
  answerType
}: AnswerCardProps) {
  return (
    <Card data-testid="card-answer" className="rounded shadow-xl border-4 border-primary overflow-hidden animate-fade-in bg-white dark:bg-gray-900">
      {/* Header - Cornell Tech Style */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 md:px-8 pt-6 pb-4 border-b-4 border-gray-200 dark:border-gray-700">
        {isOldData && (
          <div className="mb-4 flex items-start gap-2 text-sm bg-muted/80 backdrop-blur-sm px-4 py-3 rounded border-4 border-muted-foreground/20">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">
              Note: Using the most recent available data ({rosterDescr})
            </span>
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div className="font-mono text-xl md:text-2xl font-bold text-primary" data-testid="text-course-code">
                {courseInfo.subject} {courseInfo.catalogNbr}
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight" data-testid="text-course-title">
              {courseInfo.titleLong}
            </h2>
          </div>
          <ProvenanceBadge 
            rosterSlug={rosterSlug} 
            rosterDescr={rosterDescr}
            isOldData={isOldData}
          />
        </div>
      </div>

      <CardContent className="px-6 md:px-8 py-6 space-y-6">
        {/* AI-Powered Answer - Cornell Tech Style */}
        {aiAnswer && (
          <div className="space-y-3 p-5 rounded bg-primary/5 border-4 border-primary">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Sparkles className="h-5 w-5" />
              <span>AI Answer</span>
            </div>
            <p className="text-base leading-relaxed font-medium text-gray-700 dark:text-gray-300" data-testid="text-ai-answer">
              {aiAnswer}
            </p>
          </div>
        )}

        {/* Course Description */}
        {courseInfo.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              <span>Course Description</span>
            </div>
            <p className="text-base leading-relaxed text-foreground/90" data-testid="text-description">
              {courseInfo.description}
            </p>
          </div>
        )}

        {/* Quick Facts Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {courseInfo.unitsMinimum !== undefined && (
            <div className="space-y-2 p-4 rounded bg-card border-4 border-border">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>Credits</span>
              </div>
              <div className="text-lg md:text-xl font-bold" data-testid="text-credits">
                {courseInfo.unitsMinimum === courseInfo.unitsMaximum 
                  ? `${courseInfo.unitsMinimum} credit${courseInfo.unitsMinimum !== 1 ? 's' : ''}`
                  : `${courseInfo.unitsMinimum}–${courseInfo.unitsMaximum} credits`
                }
              </div>
            </div>
          )}

          {(courseInfo.gradingBasis || courseInfo.gradingBasisVariations) && (
            <div className="space-y-2 p-4 rounded bg-card border-4 border-border">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Grading Basis</span>
              </div>
              {courseInfo.gradingBasisVariations && courseInfo.gradingBasisVariations.length > 1 ? (
                <div className="space-y-2">
                  <Badge className="text-sm font-medium border-4 border-gray-300" data-testid="text-grading-basis">
                    Varies by section
                  </Badge>
                  <ul className="space-y-1.5 text-sm pl-2">
                    {courseInfo.gradingBasisVariations.map((basis, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="font-medium">{formatGradingBasis(basis)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-lg md:text-xl font-bold" data-testid="text-grading-basis">
                  {formatGradingBasis(courseInfo.gradingBasis)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule & Instructors */}
        {(courseInfo.instructors || courseInfo.meetingPatterns) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Schedule & Instructors</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {courseInfo.instructors && courseInfo.instructors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Instructor{courseInfo.instructors.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-base font-medium" data-testid="text-instructors">
                      {courseInfo.instructors.join(", ")}
                    </div>
                  </div>
                )}

                {courseInfo.meetingPatterns && courseInfo.meetingPatterns.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Meeting Times</span>
                    </div>
                    <div className="space-y-1.5" data-testid="text-schedule">
                      {courseInfo.meetingPatterns.map((pattern, idx) => (
                        <div key={idx} className="text-base">
                          <Badge className="mr-2 font-semibold border-4 border-gray-300">{pattern.days}</Badge>
                          <span className="font-medium">{pattern.timeStart} – {pattern.timeEnd}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Requirements Section */}
        {(courseInfo.prerequisites || courseInfo.permissionRequired || courseInfo.forbiddenOverlaps) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span>Requirements & Restrictions</span>
              </h3>
              
              {courseInfo.prerequisites && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Prerequisites & Corequisites</div>
                  <p className="text-base leading-relaxed" data-testid="text-prerequisites">
                    {courseInfo.prerequisites}
                  </p>
                </div>
              )}

              {courseInfo.permissionRequired && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Permission Required</div>
                  <p className="text-base leading-relaxed" data-testid="text-permission">
                    {courseInfo.permissionRequired}
                  </p>
                </div>
              )}

              {courseInfo.forbiddenOverlaps && courseInfo.forbiddenOverlaps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Cannot Be Taken With</div>
                  <div className="flex flex-wrap gap-2" data-testid="text-forbidden-overlaps">
                    {courseInfo.forbiddenOverlaps.map((overlap, idx) => (
                      <Badge key={idx} className="font-mono bg-gray-100 dark:bg-gray-800">
                        {overlap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Learning Outcomes */}
        {courseInfo.outcomes && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span>Learning Outcomes</span>
              </h3>
              <p className="text-base leading-relaxed" data-testid="text-outcomes">
                {courseInfo.outcomes}
              </p>
            </div>
          </>
        )}

        {/* Distribution & Breadth Requirements */}
        {(courseInfo.satisfiesRequirements || courseInfo.breadthRequirements || courseInfo.distributionCategories) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookmarkCheck className="h-5 w-5 text-primary" />
                <span>Distribution & Requirements</span>
              </h3>

              {courseInfo.satisfiesRequirements && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Satisfies</div>
                  <p className="text-base" data-testid="text-satisfies">
                    {courseInfo.satisfiesRequirements}
                  </p>
                </div>
              )}

              {courseInfo.breadthRequirements && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Breadth</div>
                  <p className="text-base" data-testid="text-breadth">
                    {courseInfo.breadthRequirements}
                  </p>
                </div>
              )}

              {courseInfo.distributionCategories && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Distribution Categories</div>
                  <p className="text-base" data-testid="text-distribution">
                    {courseInfo.distributionCategories}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* History */}
        {courseInfo.lastTermsOffered && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Offering History</span>
              </div>
              <div className="flex flex-wrap gap-2" data-testid="text-last-terms">
                {courseInfo.lastTermsOffered.split(',').map((term, idx) => (
                  <Badge key={idx} className="font-mono bg-gray-100 dark:bg-gray-800">
                    {term.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Official Link with Syllabus Access */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Syllabus & Official Details</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              data-testid="button-view-class"
              asChild
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <a href={classPageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Syllabus & Full Details on Cornell
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Access course syllabuses, enrollment information, and additional details on the official Cornell Class Roster page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
