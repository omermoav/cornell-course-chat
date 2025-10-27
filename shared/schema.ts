import { z } from "zod";

// Cornell API Response Types
export const rosterSchema = z.object({
  slug: z.string(),
  descr: z.string(),
  lastModifiedDttm: z.string().optional(),
});

export const subjectSchema = z.object({
  value: z.string(),
  descr: z.string(),
});

export const meetingPatternSchema = z.object({
  type: z.string().optional(),
  timeStart: z.string().optional(),
  timeEnd: z.string().optional(),
  pattern: z.string().optional(),
});

export const enrollGroupSchema = z.object({
  unitsMinimum: z.number().optional(),
  unitsMaximum: z.number().optional(),
  gradingBasis: z.string().optional(),
  gradingBasisShort: z.string().optional(),
});

export const classSchema = z.object({
  subject: z.string(),
  catalogNbr: z.string(),
  titleLong: z.string(),
  titleShort: z.string().optional(),
  description: z.string().optional(),
  enrollGroups: z.array(enrollGroupSchema).optional(),
  catalogWhenOffered: z.string().optional(),
  catalogBreadth: z.string().optional(),
  catalogDistr: z.string().optional(),
  catalogLang: z.string().optional(),
  catalogForbiddenOverlaps: z.array(z.string()).optional(),
  catalogPrereqCoreq: z.string().optional(),
  catalogSatisfiesReq: z.string().optional(),
  catalogPermission: z.string().optional(),
  catalogCourseSubfield: z.string().optional(),
  catalogOutcomeDesc: z.string().optional(),
  acadCareer: z.string().optional(),
  acadGroup: z.string().optional(),
});

// Storage Types
export interface StoredCourse {
  subject: string;
  catalogNbr: string;
  titleLong: string;
  rosterSlug: string;
  rosterDescr: z.infer<typeof rosterSchema>['descr'];
  gradingBasis?: string;
  unitsMinimum?: number;
  unitsMaximum?: number;
  instructors?: string[];
  meetingPatterns?: Array<{ days: string; timeStart: string; timeEnd: string }>;
  lastTermsOffered?: string;
  rawData: string; // JSON string of full class data
}

export interface Roster {
  slug: string;
  descr: string;
  year: number;
  termCode: number; // WI=1, SP=2, SU=3, FA=4
}

export interface Subject {
  code: string;
  name: string;
  rosterSlug: string;
}

// API Response Types
export type RosterResponse = z.infer<typeof rosterSchema>;
export type SubjectResponse = z.infer<typeof subjectSchema>;
export type ClassResponse = z.infer<typeof classSchema>;

// Question Intent Types
export type QuestionIntent = 
  | "grading" 
  | "credits" 
  | "instructor" 
  | "schedule" 
  | "history" 
  | "syllabus"
  | "passRate"
  | "general";

export interface ParsedQuestion {
  subject?: string;
  catalogNbr?: string;
  intent: QuestionIntent;
  rawQuery: string;
}

export interface AnswerResponse {
  success: boolean;
  courseInfo?: {
    subject: string;
    catalogNbr: string;
    titleLong: string;
    gradingBasis?: string;
    gradingBasisVariations?: string[];
    unitsMinimum?: number;
    unitsMaximum?: number;
    instructors?: string[];
    meetingPatterns?: Array<{ days: string; timeStart: string; timeEnd: string }>;
    lastTermsOffered?: string;
  };
  rosterSlug?: string;
  rosterDescr?: string;
  isOldData?: boolean;
  classPageUrl?: string;
  answerType?: QuestionIntent;
  message?: string;
  error?: string;
}
