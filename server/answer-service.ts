import { intentParser } from "./intent-parser";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { AnswerResponse, ParsedQuestion, StoredCourse, QuestionIntent } from "@shared/schema";

export class AnswerService {
  private formatGradingBasis(basis: string): string {
    if (basis === "Student Option") return "Student Option (Letter or S/U)";
    if (basis.includes("S/U") || basis.includes("Satisfactory/Unsatisfactory")) return "S/U only";
    if (basis === "Letter" && !basis.includes("Option")) return "Letter only";
    return basis;
  }

  private getClassPageUrl(rosterSlug: string, subject: string, catalogNbr: string): string {
    return `https://classes.cornell.edu/browse/roster/${rosterSlug}/class/${subject}/${catalogNbr}`;
  }

  private async buildAnswerFromCourse(
    course: StoredCourse,
    intent: QuestionIntent,
    isOldData: boolean = false,
    userQuestion: string = ""
  ): Promise<AnswerResponse> {
    const history = await storage.getCourseHistory(course.subject, course.catalogNbr);
    const gradingBases = new Set<string>();
    
    const sameRosterCourses = history.filter(c => c.rosterSlug === course.rosterSlug);
    for (const c of sameRosterCourses) {
      if (c.gradingBasis) {
        gradingBases.add(this.formatGradingBasis(c.gradingBasis));
      }
    }

    const classPageUrl = this.getClassPageUrl(course.rosterSlug, course.subject, course.catalogNbr);

    const courseInfo = {
      subject: course.subject,
      catalogNbr: course.catalogNbr,
      titleLong: course.titleLong,
      
      // Basic info
      description: course.description,
      gradingBasis: course.gradingBasis ? this.formatGradingBasis(course.gradingBasis) : undefined,
      gradingBasisVariations: gradingBases.size > 1 ? Array.from(gradingBases) : undefined,
      unitsMinimum: course.unitsMinimum,
      unitsMaximum: course.unitsMaximum,
      
      // Schedule
      instructors: course.instructors,
      meetingPatterns: course.meetingPatterns,
      
      // Requirements
      prerequisites: course.prerequisites,
      outcomes: course.outcomes,
      satisfiesRequirements: course.satisfiesRequirements,
      breadthRequirements: course.breadthRequirements,
      distributionCategories: course.distributionCategories,
      forbiddenOverlaps: course.forbiddenOverlaps,
      permissionRequired: course.permissionRequired,
      
      // History
      lastTermsOffered: course.lastTermsOffered,
    };

    // Generate AI-powered answer
    let aiAnswer: string | undefined;
    try {
      aiAnswer = await aiService.generateAnswer(
        userQuestion,
        { ...courseInfo, rosterDescr: course.rosterDescr },
        intent
      );
    } catch (error) {
      console.error("Failed to generate AI answer:", error);
      // Continue without AI answer if it fails
    }

    return {
      success: true,
      aiAnswer,
      courseInfo,
      rosterSlug: course.rosterSlug,
      rosterDescr: course.rosterDescr,
      isOldData,
      classPageUrl,
      answerType: intent,
    };
  }

  async answer(query: string): Promise<AnswerResponse> {
    const parsed = intentParser.parse(query);

    // Validate we have enough information
    if (!intentParser.isValid(parsed)) {
      return {
        success: false,
        error: "Could not identify a course code in your question. Please include a course code like 'NBAY 5500' or 'CS 4780'.",
      };
    }

    // Handle subject-only queries
    if (parsed.subject && !parsed.catalogNbr) {
      const courses = await storage.getCoursesBySubject(parsed.subject, 5);
      
      if (courses.length === 0) {
        return {
          success: false,
          error: `No courses found for subject ${parsed.subject}.`,
        };
      }

      return {
        success: true,
        message: `Found ${courses.length} courses in ${parsed.subject}. Here are the most recent offerings:`,
      };
    }

    // Get the latest course offering
    const latestCourse = await storage.getLatestCourse(parsed.subject!, parsed.catalogNbr!);

    if (!latestCourse) {
      return {
        success: false,
        error: `No roster history found for ${parsed.subject} ${parsed.catalogNbr}. This may be a new course or there's no public data yet.`,
      };
    }

    // Check if this is old data
    const latestRoster = await storage.getLatestRoster();
    const isOldData = latestRoster ? latestCourse.rosterSlug !== latestRoster.slug : false;

    return this.buildAnswerFromCourse(latestCourse, parsed.intent, isOldData, parsed.rawQuery);
  }
}

export const answerService = new AnswerService();
