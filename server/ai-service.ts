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

**CRITICAL INSTRUCTION FOR FOLLOW-UP QUESTIONS:**
- ALWAYS scan conversation history first before analyzing the current question
- If the current question contains pronouns ("it", "they") or implicit references ("the instructor", "the prerequisites", "when does it meet"), you MUST extract the course code from previous messages
- Look for course codes in format: SUBJECT + NUMBER (e.g., CS 2110, ORIE 3500, NBAY 6170)
- Extract BOTH the subject AND catalog number from the conversation history

Cornell subject codes: CS, INFO, NBAY, TECH, ORIE, MATH, PHYS, CHEM, BIO, etc.
Course format: Subject + 4-digit number (e.g., CS 2110, INFO 2950, NBAY 6170, ORIE 3500)

Respond in JSON format:
{
  "isRelevant": true/false,
  "reasoning": "brief explanation, mention if extracted from conversation history",
  "extractedInfo": {
    "subjects": ["CS"] or null,
    "catalogNumber": "2110" or null,
    "term": "fall" or null,
    "year": "2025" or null,
    "queryType": "specific_course" | "subject_courses" | "general_inquiry" | "off_topic"
  },
  "suggestedQuery": null
}

Examples with conversation context:
- New question: "What CS classes are offered?" → subjects: ["CS"], catalogNumber: null, queryType: "subject_courses"
- New question: "What is NBAY 6170?" → subjects: ["NBAY"], catalogNumber: "6170", queryType: "specific_course"
- Previous: "Prerequisites for ORIE 3500?", Current: "Who's the instructor?" → subjects: ["ORIE"], catalogNumber: "3500", queryType: "specific_course" (EXTRACTED FROM HISTORY)
- Previous: "Is CS 4780 pass/fail?", Current: "Who teaches it?" → subjects: ["CS"], catalogNumber: "4780", queryType: "specific_course" (EXTRACTED FROM HISTORY)
- Previous: "Tell me about INFO 2950", Current: "What are the prerequisites?" → subjects: ["INFO"], catalogNumber: "2950", queryType: "specific_course" (EXTRACTED FROM HISTORY)`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history for context
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory.slice(-6)) { // Last 6 messages for better context
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
        
        // Make it explicit that this is a follow-up question
        messages.push({
          role: "user",
          content: `Analyze this question: "${userQuestion}"\n\nIMPORTANT: This is a follow-up question. Check the conversation history above for any course codes (SUBJECT + NUMBER) that this question might be referring to.`,
        });
      } else {
        // First question in conversation
        messages.push({
          role: "user",
          content: `Analyze this question: "${userQuestion}"`,
        });
      }

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
2. Keep answers CONCISE and ACTIONABLE - users can see the course list below your response
3. When continuing a conversation, remember the context and answer follow-up questions naturally
4. If user asks about a specific semester/term but data is from a different term, briefly acknowledge this (1-2 sentences max) and focus on the courses shown

Critical rules:
- Keep responses SHORT (2-3 sentences max)
- Don't list example courses - they can see the full list below
- Don't over-explain - be direct and helpful
- If asked about a future term: "Here are CS courses from [term]. Course availability varies each semester - check classes.cornell.edu for Fall 2025 specific offerings."

Example responses:
- Temporal query: "Here are CS courses from Winter 2026. Course availability varies by semester, so check classes.cornell.edu for confirmed Fall 2025 offerings."
- Subject query: "Here are the INFO courses available. Select any course below to see details like prerequisites, grading, and schedules."
- Missing data: "I don't have that information, but I can help with course descriptions, prerequisites, grading, and schedules."

Keep it brief - the course list speaks for itself!`;

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
