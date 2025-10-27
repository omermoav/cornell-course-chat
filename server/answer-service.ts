import { intentParser } from "./intent-parser";
import { storage } from "./storage";
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
    isOldData: boolean = false
  ): Promise<AnswerResponse> {
    // Check for grading basis variations
    const history = await storage.getCourseHistory(course.subject, course.catalogNbr);
    const gradingBases = new Set<string>();
    
    // Get all grading bases from the same roster
    const sameRosterCourses = history.filter(c => c.rosterSlug === course.rosterSlug);
    for (const c of sameRosterCourses) {
      if (c.gradingBasis) {
        gradingBases.add(this.formatGradingBasis(c.gradingBasis));
      }
    }

    const classPageUrl = this.getClassPageUrl(course.rosterSlug, course.subject, course.catalogNbr);

    return {
      success: true,
      courseInfo: {
        subject: course.subject,
        catalogNbr: course.catalogNbr,
        titleLong: course.titleLong,
        gradingBasis: course.gradingBasis ? this.formatGradingBasis(course.gradingBasis) : undefined,
        gradingBasisVariations: gradingBases.size > 1 ? Array.from(gradingBases) : undefined,
        unitsMinimum: course.unitsMinimum,
        unitsMaximum: course.unitsMaximum,
        instructors: course.instructors,
        meetingPatterns: course.meetingPatterns,
        lastTermsOffered: course.lastTermsOffered,
      },
      rosterSlug: course.rosterSlug,
      rosterDescr: course.rosterDescr,
      isOldData,
      classPageUrl,
      answerType: intent,
    };
  }

  async answer(query: string): Promise<AnswerResponse> {
    // Parse the question
    const parsed = intentParser.parse(query);

    // Check for pass rate questions first
    if (parsed.intent === "passRate") {
      let classPageUrl: string | undefined;
      
      if (parsed.subject && parsed.catalogNbr) {
        const course = await storage.getLatestCourse(parsed.subject, parsed.catalogNbr);
        if (course) {
          classPageUrl = this.getClassPageUrl(course.rosterSlug, course.subject, course.catalogNbr);
        }
      }

      return {
        success: false,
        message: "Cornell does not publish current pass rates/median grades via the Class Roster; I can share grading basis and link the official class page.",
        classPageUrl,
      };
    }

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

      // Return info about the subject with top courses
      return {
        success: true,
        message: `Found ${courses.length} courses in ${parsed.subject}. Here are the most recent offerings:`,
        // TODO: Format this better for subject queries
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

    return this.buildAnswerFromCourse(latestCourse, parsed.intent, isOldData);
  }
}

export const answerService = new AnswerService();
