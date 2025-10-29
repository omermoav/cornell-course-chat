import { intentParser } from "./intent-parser";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { AnswerResponse, ParsedQuestion, StoredCourse, QuestionIntent, ChatMessage } from "@shared/schema";
import { formatGradingBasis } from "@shared/grading-utils";

export class AnswerService {

  private getClassPageUrl(rosterSlug: string, subject: string, catalogNbr: string): string {
    return `https://classes.cornell.edu/browse/roster/${rosterSlug}/class/${subject}/${catalogNbr}`;
  }

  private async buildAnswerFromCourse(
    course: StoredCourse,
    intent: QuestionIntent,
    isOldData: boolean = false,
    userQuestion: string = "",
    conversationHistory?: ChatMessage[]
  ): Promise<AnswerResponse> {
    const history = await storage.getCourseHistory(course.subject, course.catalogNbr);
    const gradingBases = new Set<string>();
    
    const sameRosterCourses = history.filter(c => c.rosterSlug === course.rosterSlug);
    for (const c of sameRosterCourses) {
      if (c.gradingBasis) {
        gradingBases.add(formatGradingBasis(c.gradingBasis));
      }
    }

    const classPageUrl = this.getClassPageUrl(course.rosterSlug, course.subject, course.catalogNbr);

    const courseInfo = {
      subject: course.subject,
      catalogNbr: course.catalogNbr,
      titleLong: course.titleLong,
      
      // Basic info
      description: course.description,
      gradingBasis: course.gradingBasis ? formatGradingBasis(course.gradingBasis) : undefined,
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
        intent,
        conversationHistory
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

  async answer(query: string, conversationHistory?: ChatMessage[]): Promise<AnswerResponse> {
    // Use AI to understand the query first
    const understanding = await aiService.understandQuery(query, conversationHistory);
    
    // Handle off-topic questions politely
    if (!understanding.isRelevant) {
      return {
        success: true,
        aiAnswer: `I appreciate your question, but I'm specifically designed to help with Cornell University course information. I can answer questions about:

• Specific courses (e.g., "What is CS 2110?")
• Course schedules and instructors
• Prerequisites and requirements
• Grading policies
• Learning outcomes
• Available courses in different subjects

${understanding.suggestedQuery ? `Perhaps you meant to ask: "${understanding.suggestedQuery}"?` : 'Feel free to ask me anything about Cornell courses!'}`,
        answerType: 'general',
        suggestions: [
          "What is NBAY 6170?",
          "What CS courses are offered?",
          "Prerequisites for ORIE 3500?",
          "Is CS 4780 pass/fail?",
        ]
      };
    }
    
    // Use the traditional parser as fallback, but enhanced with AI understanding
    const parsed = intentParser.parse(query);

    // Try title search if no course code found
    if (!parsed.subject && !parsed.catalogNbr && parsed.titleQuery) {
      const matches = await storage.searchByTitle(parsed.titleQuery);
      
      if (matches.length === 0) {
        // Use AI to handle the broad question
        const stats = await storage.getStats();
        const availableData = `I have access to ${stats.courses} Cornell courses across ${stats.rosters} semesters, including subjects like CS (Computer Science), INFO (Information Science), NBAY (Cornell Tech), TECH (Cornell Tech), and many more.`;
        
        const aiResponse = await aiService.handleBroadQuestion(query, availableData, conversationHistory);
        
        return {
          success: true,
          aiAnswer: aiResponse,
          answerType: 'general',
          suggestions: [
            "What is NBAY 6170?",
            "Is CS 4780 pass/fail?",
            "What courses does INFO offer?",
            "Prerequisites for ORIE 3500?",
            "When does CS 2110 meet?"
          ]
        };
      }

      if (matches.length === 1) {
        // Single match - answer about that course
        const latestRoster = await storage.getLatestRoster();
        const isOldData = latestRoster ? matches[0].rosterSlug !== latestRoster.slug : false;
        return this.buildAnswerFromCourse(matches[0], parsed.intent, isOldData, parsed.rawQuery, conversationHistory);
      }

      // Multiple matches - show options
      const courseList = matches.slice(0, 5).map(c => `${c.subject} ${c.catalogNbr} - ${c.titleLong}`).join('\n');
      return {
        success: false,
        error: `Found ${matches.length} courses matching "${parsed.titleQuery}". Please be more specific or use a course code:\n\n${courseList}`,
      };
    }

    // Handle broad questions without specific course info
    if (!intentParser.isValid(parsed)) {
      // Check if AI understanding extracted subjects
      if (understanding.extractedInfo.subjects && understanding.extractedInfo.subjects.length > 0) {
        // Use AI-extracted subject(s) to search
        const subject = understanding.extractedInfo.subjects[0]; // Use first subject
        const courses = await storage.getCoursesBySubject(subject, 100);
        
        if (courses.length > 0) {
          // Group by catalog number to get unique courses
          const uniqueCourses = new Map<string, StoredCourse>();
          for (const course of courses) {
            const key = `${course.subject}-${course.catalogNbr}`;
            if (!uniqueCourses.has(key)) {
              uniqueCourses.set(key, course);
            }
          }

          const courseList = Array.from(uniqueCourses.values())
            .slice(0, 20)
            .map(c => `${c.subject} ${c.catalogNbr} - ${c.titleLong}`)
            .join('\n');

          const latestRoster = await storage.getLatestRoster();
          const latestTerm = latestRoster ? latestRoster.descr : "the latest available term";
          
          let contextNote = "";
          if (understanding.extractedInfo.term || understanding.extractedInfo.year) {
            contextNote = `\n\nNote: Course schedules vary by semester. This data is from ${latestTerm}. For the most current information about specific terms, please check the official Cornell Class Roster at classes.cornell.edu.`;
          }

          const availableData = `Subject: ${subject}\nTotal courses: ${uniqueCourses.size}\nData from: ${latestTerm}\n\nSample courses:\n${courseList}${contextNote}`;
          const aiResponse = await aiService.handleBroadQuestion(query, availableData, conversationHistory);

          return {
            success: true,
            aiAnswer: aiResponse,
            answerType: 'general',
            courseList: Array.from(uniqueCourses.values()).slice(0, 20),
          };
        }
      }
      
      // No valid parsing and no AI-extracted subjects - general inquiry
      const stats = await storage.getStats();
      const availableData = `I have access to ${stats.courses} Cornell courses across ${stats.rosters} semesters. I can help you with:
- Course descriptions and details (e.g., "What is NBAY 6170?")
- Grading information (e.g., "Is CS 4780 pass/fail?")
- Prerequisites and requirements
- Course schedules and instructors
- Learning outcomes
- All courses in a subject (e.g., "What CS courses are available?")`;
      
      const aiResponse = await aiService.handleBroadQuestion(query, availableData, conversationHistory);
      
      return {
        success: true,
        aiAnswer: aiResponse,
        answerType: 'general',
        suggestions: [
          "What is NBAY 6170?",
          "Is CS 4780 pass/fail?",
          "What INFO courses are offered?",
          "Tell me about machine learning courses",
          "Prerequisites for CS 2110?"
        ]
      };
    }

    // Handle subject-only queries
    if (parsed.subject && !parsed.catalogNbr) {
      const courses = await storage.getCoursesBySubject(parsed.subject, 100);
      
      if (courses.length === 0) {
        return {
          success: false,
          error: `No courses found for subject ${parsed.subject}. Try asking about other subjects like CS, INFO, NBAY, or TECH.`,
          suggestions: [
            "What CS courses are available?",
            "Tell me about INFO courses",
            "What is NBAY 6170?"
          ]
        };
      }

      // Group by catalog number to get unique courses
      const uniqueCourses = new Map<string, StoredCourse>();
      for (const course of courses) {
        const key = `${course.subject}-${course.catalogNbr}`;
        if (!uniqueCourses.has(key)) {
          uniqueCourses.set(key, course);
        }
      }

      const courseList = Array.from(uniqueCourses.values())
        .slice(0, 20)
        .map(c => `${c.subject} ${c.catalogNbr} - ${c.titleLong}`)
        .join('\n');

      // Check if this is a temporal query (asking about specific semester/term)
      const lowerQuery = query.toLowerCase();
      const isTemporalQuery = lowerQuery.match(/\b(fall|spring|summer|winter|semester|term|20\d{2})\b/) !== null;
      
      const latestRoster = await storage.getLatestRoster();
      const latestTerm = latestRoster ? latestRoster.descr : "the latest available term";
      
      let contextNote = "";
      if (isTemporalQuery) {
        contextNote = `\n\nNote: Course schedules vary by semester. This data is from ${latestTerm}. For the most current information about specific terms, please check the official Cornell Class Roster at classes.cornell.edu.`;
      }

      const availableData = `Subject: ${parsed.subject}\nTotal courses: ${uniqueCourses.size}\nData from: ${latestTerm}\n\nSample courses:\n${courseList}${contextNote}`;
      const aiResponse = await aiService.handleBroadQuestion(query, availableData, conversationHistory);

      return {
        success: true,
        aiAnswer: aiResponse,
        answerType: 'general',
        courseList: Array.from(uniqueCourses.values()).slice(0, 20),
      };
    }

    // Get the latest course offering
    const latestCourse = await storage.getLatestCourse(parsed.subject!, parsed.catalogNbr!);

    if (!latestCourse) {
      const aiResponse = await aiService.handleBroadQuestion(
        query,
        `Course ${parsed.subject} ${parsed.catalogNbr} was not found in the database. This course may not exist, may not be currently offered, or may not be in the public catalog.`,
        conversationHistory
      );
      
      return {
        success: false,
        error: `No roster history found for ${parsed.subject} ${parsed.catalogNbr}.`,
        aiAnswer: aiResponse,
        suggestions: [
          `What ${parsed.subject} courses are available?`,
          "What is NBAY 6170?",
          "Tell me about CS courses",
        ]
      };
    }

    // Check if this is old data
    const latestRoster = await storage.getLatestRoster();
    const isOldData = latestRoster ? latestCourse.rosterSlug !== latestRoster.slug : false;

    return this.buildAnswerFromCourse(latestCourse, parsed.intent, isOldData, parsed.rawQuery, conversationHistory);
  }
}

export const answerService = new AnswerService();
