import { ParsedQuestion, QuestionIntent } from "@shared/schema";

export class IntentParser {
  /**
   * Extract course code from natural language query
   * Supports formats like: "NBAY 5500", "CS4780", "INFO 2950"
   */
  private extractCourseCode(query: string): { subject?: string; catalogNbr?: string } {
    // Pattern: 2-4 letters followed by optional space and 4 digits
    const pattern = /\b([A-Z]{2,4})\s*(\d{4})\b/i;
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
    
    // Pass rate / grade distribution (special policy case)
    if (lowerQuery.match(/\b(pass\s*rate|grade\s*distrib|median\s*grade|average\s*grade)\b/)) {
      return "passRate";
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
    
    // Syllabus
    if (lowerQuery.match(/\b(syllabus|syllabi|course\s*outline)\b/)) {
      return "syllabus";
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
    
    return {
      subject,
      catalogNbr,
      intent,
      rawQuery: query,
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
