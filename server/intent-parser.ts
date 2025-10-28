import { ParsedQuestion, QuestionIntent } from "@shared/schema";

export class IntentParser {
  /**
   * Extract course code from natural language query
   * Supports formats like: "NBAY 5500", "CS4780", "INFO 2950", "ANTHR 1101"
   */
  private extractCourseCode(query: string): { subject?: string; catalogNbr?: string } {
    // Pattern: 2-5 letters followed by optional space and exactly 4 digits
    // Cornell subject codes are 2-5 letters (e.g., CS, INFO, ANTHR, BIOBM, CHEME)
    // Catalog numbers are always 4 digits (e.g., 1110, 2950, 5500)
    const pattern = /\b([A-Z]{2,5})\s*(\d{4})\b/i;
    const match = query.match(pattern);
    
    if (match) {
      return {
        subject: match[1].toUpperCase(),
        catalogNbr: match[2],
      };
    }
    
    return {};
  }

  /**
   * Detect the intent of the question based on keywords
   */
  private detectIntent(query: string): QuestionIntent {
    const lowerQuery = query.toLowerCase();
    
    // Prerequisites / requirements
    if (lowerQuery.match(/\b(prereq|pre-req|prerequisite|coreq|co-req|corequisite|requirement)\b/)) {
      return "prerequisites";
    }
    
    // Learning outcomes
    if (lowerQuery.match(/\b(outcome|learning\s*outcome|objective|learn|cover|topic)\b/)) {
      return "outcomes";
    }
    
    // Grading basis
    if (lowerQuery.match(/\b(pass\s*fail|pass\/fail|s\/u|letter|grading|grade\s*basis|student\s*option)\b/)) {
      return "grading";
    }
    
    // Credits
    if (lowerQuery.match(/\b(credit|credits|credit\s*hours?|units?)\b/)) {
      return "credits";
    }
    
    // Instructor
    if (lowerQuery.match(/\b(instructor|professor|prof|teacher|taught\s*by|who\s*teaches)\b/)) {
      return "instructor";
    }
    
    // Schedule / meeting times
    if (lowerQuery.match(/\b(time|times?|schedule|meet|meets?|when|days?|hours?)\b/) && 
        !lowerQuery.match(/\b(credit\s*hours?)\b/)) {
      return "schedule";
    }
    
    // History / last offered
    if (lowerQuery.match(/\b(history|last\s*offered|when\s*offered|previous|past\s*term)\b/)) {
      return "history";
    }
    
    // Description
    if (lowerQuery.match(/\b(about|describe|description|what\s*is|tell\s*me)\b/)) {
      return "description";
    }
    
    // Requirements (breadth, distribution)
    if (lowerQuery.match(/\b(breadth|distribution|satisfy|satisfies|requirement)\b/)) {
      return "requirements";
    }
    
    // Default to general
    return "general";
  }

  /**
   * Parse a natural language question into structured data
   */
  parse(query: string): ParsedQuestion {
    const { subject, catalogNbr } = this.extractCourseCode(query);
    const intent = this.detectIntent(query);
    
    // If no course code found, extract potential course title
    let titleQuery: string | undefined;
    if (!subject && !catalogNbr) {
      // Extract course title from questions like:
      // "What is Designing & Building AI Solutions about?"
      // "Tell me about Introduction to Machine Learning"
      // "Is Database Systems pass/fail?"
      
      // Remove common question words/phrases
      const cleaned = query
        .replace(/\b(what|is|are|about|tell me about|describe|who teaches|how many credits|when does|credits for|syllabus for|does|meet|grading for|prerequisites for|pass\/?fail)\b/gi, '')
        .replace(/\?/g, '')
        .trim();
      
      // If we have substantial text left (likely a course title), use it
      if (cleaned.length > 3) {
        titleQuery = cleaned;
      }
    }
    
    return {
      subject,
      catalogNbr,
      intent,
      rawQuery: query,
      titleQuery,
    };
  }

  /**
   * Validate that we have enough information to answer the question
   */
  isValid(parsed: ParsedQuestion): boolean {
    // For subject-only queries (no catalog number), we can still provide info
    if (parsed.subject && !parsed.catalogNbr) {
      return true;
    }
    
    // For specific course queries, we need both subject and catalog number
    return !!(parsed.subject && parsed.catalogNbr);
  }
}

export const intentParser = new IntentParser();
