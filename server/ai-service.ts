import OpenAI from "openai";
import { QuestionIntent } from "@shared/schema";

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

  async generateAnswer(
    userQuestion: string,
    courseContext: CourseContext,
    intent: QuestionIntent
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

      const systemPrompt = `You are a helpful Cornell University course advisor. Answer student questions about courses directly and concisely based on official course data.

Guidelines:
- Answer the specific question asked
- Be conversational and friendly but professional
- Keep answers focused and to-the-point (2-4 sentences ideal)
- Use the course data provided - don't make up information
- If asked about grading, credits, prerequisites, etc., provide the specific information
- For general "what is" questions, give a brief overview highlighting key aspects
- Don't repeat information unnecessarily
- Don't say "based on the information provided" - just answer naturally`;

      const courseInfo = contextParts.join('\n');

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Course Information:\n${courseInfo}\n\nStudent Question: ${userQuestion}` },
        ],
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
