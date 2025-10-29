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
    
    console.log('[AnswerService] AI Understanding:', JSON.stringify(understanding, null, 2));
    
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
    
    // If AI successfully extracted subjects, use them directly
    if (understanding.extractedInfo.subjects && understanding.extractedInfo.subjects.length > 0) {
      console.log('[AnswerService] Using AI-extracted subjects:', understanding.extractedInfo.subjects);
      
      const subject = understanding.extractedInfo.subjects[0];
      const catalogNbr = understanding.extractedInfo.catalogNumber;
      
      // Specific course query
      if (catalogNbr) {
        const latestCourse = await storage.getLatestCourse(subject, catalogNbr);
        if (latestCourse) {
          const latestRoster = await storage.getLatestRoster();
          const isOldData = latestRoster ? latestCourse.rosterSlug !== latestRoster.slug : false;
          const intent = intentParser.detectIntent(query);
          
          // Check if this is a follow-up question (conversation exists and mentions same course)
          const isFollowUp = conversationHistory && conversationHistory.length > 0 && 
            conversationHistory.some(msg => 
              msg.content.includes(subject) && msg.content.includes(catalogNbr)
            );
          
          // For follow-up questions, return just the AI answer without the full course card
          if (isFollowUp) {
            const courseContext = {
              subject: latestCourse.subject,
              catalogNbr: latestCourse.catalogNbr,
              titleLong: latestCourse.titleLong,
              description: latestCourse.description,
              gradingBasis: latestCourse.gradingBasis,
              unitsMinimum: latestCourse.unitsMinimum,
              unitsMaximum: latestCourse.unitsMaximum,
              instructors: latestCourse.instructors,
              meetingPatterns: latestCourse.meetingPatterns,
              prerequisites: latestCourse.prerequisites,
              rosterDescr: latestCourse.rosterDescr,
            };
            
            const aiAnswer = await aiService.generateAnswer(query, courseContext, intent, conversationHistory);
            
            return {
              success: true,
              aiAnswer,
              answerType: intent,
              suggestions: [
                "What are the prerequisites?",
                "When does it meet?",
                "How many credits is it?",
                `What other ${subject} courses are offered?`,
              ]
            };
          }
          
          return this.buildAnswerFromCourse(latestCourse, intent, isOldData, query, conversationHistory);
        }
      }
      
      // Subject-only query
      // Determine target roster based on extracted term/year
      let targetRoster = await storage.getLatestRoster();
      if (understanding.extractedInfo.term && understanding.extractedInfo.year) {
        const allRosters = await storage.getRosters();
        const requestedRoster = allRosters.find(r => 
          r.year === Number(understanding.extractedInfo.year) && 
          r.descr.toLowerCase().includes(understanding.extractedInfo.term!.toLowerCase())
        );
        if (requestedRoster) {
          targetRoster = requestedRoster;
        }
      }
      
      const courses = await storage.getCoursesBySubject(subject, 100);
      if (courses.length > 0) {
        const uniqueCourses = new Map<string, StoredCourse>();
        
        // If user specified a term/year, filter to that roster first
        const relevantCourses = targetRoster && (understanding.extractedInfo.term || understanding.extractedInfo.year)
          ? courses.filter(c => c.rosterSlug === targetRoster.slug)
          : courses;
        
        for (const course of relevantCourses.length > 0 ? relevantCourses : courses) {
          const key = `${course.subject}-${course.catalogNbr}`;
          if (!uniqueCourses.has(key)) {
            uniqueCourses.set(key, course);
          }
        }

        const courseList = Array.from(uniqueCourses.values())
          .slice(0, 20)
          .map(c => `${c.subject} ${c.catalogNbr} - ${c.titleLong}`)
          .join('\n');

        const actualTerm = targetRoster ? targetRoster.descr : "the latest available term";
        
        let contextNote = "";
        if (relevantCourses.length === 0 && understanding.extractedInfo.term && understanding.extractedInfo.year) {
          contextNote = `\n\nNote: No courses found for ${understanding.extractedInfo.term} ${understanding.extractedInfo.year}. Showing courses from ${actualTerm} instead. Course availability varies by semester.`;
        } else if (understanding.extractedInfo.term || understanding.extractedInfo.year) {
          contextNote = `\n\nNote: This data is from ${actualTerm}. Course schedules vary by semester. For the most current information, check classes.cornell.edu.`;
        }

        const availableData = `Subject: ${subject}\nTotal courses: ${uniqueCourses.size}\nData from: ${actualTerm}\n\nSample courses:\n${courseList}${contextNote}`;
        const aiResponse = await aiService.handleBroadQuestion(query, availableData, conversationHistory);

        return {
          success: true,
          aiAnswer: aiResponse,
          answerType: 'general',
          courseList: Array.from(uniqueCourses.values()).slice(0, 20),
        };
      }
    }
    
    // Use the traditional parser as fallback
    console.log('[AnswerService] Falling back to traditional parser');
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
      console.log('[AnswerService] Invalid parse, checking for broad temporal query');
      
      // Check if this is a vague temporal query (e.g., "What classes are offered in 2025?")
      const lowerQuery = query.toLowerCase();
      const isTemporalQuery = lowerQuery.match(/\b(fall|spring|summer|winter|semester|term|20\d{2})\b/) !== null;
      const isVagueQuery = lowerQuery.match(/^what\s+(are\s+)?the\s+classes/i) || 
                          lowerQuery.match(/^what\s+classes\s+(are|in|for)/i);
      
      if (isTemporalQuery && isVagueQuery) {
        const stats = await storage.getStats();
        const latestRoster = await storage.getLatestRoster();
        const termInfo = latestRoster ? latestRoster.descr : "the latest available term";
        
        return {
          success: true,
          aiAnswer: `I'd be happy to help you explore Cornell courses! However, I need to know which subject you're interested in.

I have data for ${stats.courses} courses across ${stats.rosters} semesters (data from ${termInfo}). Course offerings vary by semester.

**Please specify a subject**, such as:
• CS (Computer Science)
• INFO (Information Science)  
• NBAY (Cornell Tech Business Analytics)
• TECH (Cornell Tech)
• ORIE (Operations Research)
• MATH, PHYS, CHEM, BIO, etc.

For example, try asking:
• "What CS courses are offered?"
• "Tell me about Cornell Tech courses"
• "Show me INFO classes"`,
          answerType: 'general',
          suggestions: [
            "What CS courses are offered?",
            "Tell me about Cornell Tech courses",
            "What INFO classes are available?",
            "Show me NBAY courses"
          ]
        };
      }
      
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
