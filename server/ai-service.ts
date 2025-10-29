import OpenAI from "openai";
import { QuestionIntent, ChatMessage } from "@shared/schema";

interface CourseContext {
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
  rosterDescr: string;
}

export interface QueryUnderstanding {
  isRelevant: boolean;
  reasoning: string;
  extractedInfo: {
    subjects?: string[];
    catalogNumber?: string;
    term?: string;
    year?: string;
    queryType: 'specific_course' | 'subject_courses' | 'general_inquiry' | 'off_topic';
  };
  suggestedQuery?: string;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    // Support both OpenAI and Groq (free alternative)
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    
    this.openai = new OpenAI({
      baseURL,
      apiKey,
    });
    
    console.log('[AIService] Initialized with base URL:', baseURL);
  }

  /**
   * Use AI to understand the user's query and determine if it's relevant
   */
  async understandQuery(userQuestion: string, conversationHistory?: ChatMessage[]): Promise<QueryUnderstanding> {
    try {
      console.log('[AIService] Understanding query:', userQuestion);
      
      const systemPrompt = `You are a query understanding system for a Cornell University course information chatbot.

Your job is to analyze user questions and determine:
1. Is this question relevant to Cornell University courses? (course details, schedules, prerequisites, grading, etc.)
2. What information is the user asking for?
3. What subjects/courses are mentioned?

Cornell subject codes include: CS (Computer Science), INFO (Information Science), NBAY (Cornell Tech Business), TECH (Cornell Tech), ORIE (Operations Research), MATH, PHYS, CHEM, BIO, etc.

Course codes format: Subject + 4-digit number (e.g., CS 2110, INFO 2950, NBAY 6170)

Respond in JSON format:
{
  "isRelevant": true/false,
  "reasoning": "brief explanation",
  "extractedInfo": {
    "subjects": ["CS", "INFO"] or null,
    "catalogNumber": "2110" or null,
    "term": "fall" or null,
    "year": "2025" or null,
    "queryType": "specific_course" | "subject_courses" | "general_inquiry" | "off_topic"
  },
  "suggestedQuery": "reformulated query if needed" or null
}

Examples:
- "What CS classes are offered in 2025?" → isRelevant: true, subjects: ["CS"], queryType: "subject_courses"
- "What is NBAY 6170?" → isRelevant: true, subjects: ["NBAY"], catalogNumber: "6170", queryType: "specific_course"
- "What's the weather today?" → isRelevant: false, queryType: "off_topic"
- "Tell me about Cornell Tech courses" → isRelevant: true, subjects: ["NBAY", "TECH"], queryType: "subject_courses"`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history for context
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory.slice(-4)) { // Last 4 messages for context
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      messages.push({
        role: "user",
        content: `Analyze this question: "${userQuestion}"`,
      });

      // Use different models based on provider
      const isGroq = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.includes('groq.com');
      const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.3, // Lower temperature for more consistent parsing
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      const understanding = {
        isRelevant: result.isRelevant ?? true, // Default to true to be helpful
        reasoning: result.reasoning || "Unable to parse query",
        extractedInfo: result.extractedInfo || { queryType: 'general_inquiry' },
        suggestedQuery: result.suggestedQuery,
      };
      
      console.log('[AIService] Understanding result:', JSON.stringify(understanding, null, 2));
      
      return understanding;
    } catch (error) {
      console.error('[AIService] Query understanding error:', error);
      console.error('[AIService] Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Default to treating as relevant general inquiry
      return {
        isRelevant: true,
        reasoning: "Error parsing query, treating as general inquiry",
        extractedInfo: { queryType: 'general_inquiry' },
      };
    }
  }

  async handleBroadQuestion(
    userQuestion: string, 
    availableData: string,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    try {
      const systemPrompt = `You are a helpful Cornell University course advisor with access to the Cornell Class Roster API data. 

Your role:
1. Answer questions about Cornell courses using the data provided
2. For questions you CAN'T answer with the data, acknowledge this politely and suggest related questions you CAN answer
3. Be MECE (Mutually Exclusive, Collectively Exhaustive) - provide complete, organized answers
4. When continuing a conversation, remember the context and answer follow-up questions naturally
5. If the user asks about a specific semester/term (like "Fall 2025") but the data is from a different term, acknowledge this clearly and explain that course offerings may vary by semester

Example helpful responses:
- When data is unavailable: "I don't have information about majors/programs, but I can help you explore courses! Try asking: 'What CS courses are offered?' or 'Tell me about NBAY 6170'"
- When asked about future terms: "I don't have specific data for Fall 2025 yet, but I can show you CS courses that are typically offered based on recent terms. Course availability varies each semester, so check classes.cornell.edu closer to registration for confirmed offerings."
- For general questions: "I can tell you about: course descriptions, prerequisites, grading, schedules, instructors, and learning outcomes. Try asking about a specific course!"

Keep answers conversational, helpful, and clear about data limitations.`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Add current question
      messages.push({
        role: "user",
        content: `Available Data:\n${availableData}\n\nStudent Question: ${userQuestion}`,
      });

      // Use different models based on provider
      const isGroq = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.includes('groq.com');
      const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || "I couldn't generate an answer at this time.";
    } catch (error) {
      console.error("AI service error:", error);
      return "I couldn't generate an answer at this time.";
    }
  }

  async generateAnswer(
    userQuestion: string,
    courseContext: CourseContext,
    intent: QuestionIntent,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    try {
      // Build comprehensive course context
      const contextParts: string[] = [
        `Course: ${courseContext.subject} ${courseContext.catalogNbr} - ${courseContext.titleLong}`,
        `Semester: ${courseContext.rosterDescr}`,
      ];

      if (courseContext.description) {
        contextParts.push(`Description: ${courseContext.description}`);
      }

      if (courseContext.unitsMinimum !== undefined) {
        const credits = courseContext.unitsMinimum === courseContext.unitsMaximum
          ? `${courseContext.unitsMinimum} credit${courseContext.unitsMinimum !== 1 ? 's' : ''}`
          : `${courseContext.unitsMinimum}–${courseContext.unitsMaximum} credits`;
        contextParts.push(`Credits: ${credits}`);
      }

      if (courseContext.gradingBasis) {
        contextParts.push(`Grading: ${courseContext.gradingBasis}`);
      }

      if (courseContext.gradingBasisVariations && courseContext.gradingBasisVariations.length > 1) {
        contextParts.push(`Grading varies by section: ${courseContext.gradingBasisVariations.join(', ')}`);
      }

      if (courseContext.instructors && courseContext.instructors.length > 0) {
        contextParts.push(`Instructor(s): ${courseContext.instructors.join(', ')}`);
      }

      if (courseContext.meetingPatterns && courseContext.meetingPatterns.length > 0) {
        const schedules = courseContext.meetingPatterns
          .map(p => `${p.days} ${p.timeStart}–${p.timeEnd}`)
          .join('; ');
        contextParts.push(`Schedule: ${schedules}`);
      }

      if (courseContext.prerequisites) {
        contextParts.push(`Prerequisites: ${courseContext.prerequisites}`);
      }

      if (courseContext.outcomes) {
        contextParts.push(`Learning Outcomes: ${courseContext.outcomes}`);
      }

      if (courseContext.satisfiesRequirements) {
        contextParts.push(`Satisfies: ${courseContext.satisfiesRequirements}`);
      }

      if (courseContext.breadthRequirements) {
        contextParts.push(`Breadth: ${courseContext.breadthRequirements}`);
      }

      if (courseContext.distributionCategories) {
        contextParts.push(`Distribution: ${courseContext.distributionCategories}`);
      }

      if (courseContext.forbiddenOverlaps && courseContext.forbiddenOverlaps.length > 0) {
        contextParts.push(`Cannot be taken with: ${courseContext.forbiddenOverlaps.join(', ')}`);
      }

      if (courseContext.permissionRequired) {
        contextParts.push(`Permission: ${courseContext.permissionRequired}`);
      }

      if (courseContext.lastTermsOffered) {
        contextParts.push(`Previously offered: ${courseContext.lastTermsOffered}`);
      }

      const systemPrompt = `You are a helpful Cornell University course advisor. Answer student questions about courses using ONLY the specific data provided - be factual and precise.

Critical Rules:
- State facts directly from the course data without adding qualifiers like "typically" or "generally"
- For grading questions: state the exact grading basis (GRI, OPT, SUS, etc.) without interpreting what it means
- For credits: state the exact number from the data
- For instructors/schedule/prerequisites: use the exact information provided
- Keep answers brief (2-4 sentences) but factually accurate
- Never add generic explanations or interpretations
- If data is missing for what's asked, say so directly
- Be conversational but stick strictly to the facts provided
- When continuing a conversation, remember the context and answer follow-up questions naturally`;

      const courseInfo = contextParts.join('\n');

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Add current question with context
      messages.push({
        role: "user",
        content: `Course Information:\n${courseInfo}\n\nStudent Question: ${userQuestion}`,
      });

      // Use different models based on provider
      const isGroq = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.includes('groq.com');
      const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || "I couldn't generate an answer at this time.";
    } catch (error) {
      console.error("AI service error:", error);
      return "I couldn't generate an answer at this time.";
    }
  }
}

export const aiService = new AIService();
