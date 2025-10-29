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

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
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

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
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

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
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
