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

export const instructorSchema = z.object({
  netid: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
});

export const meetingSchema = z.object({
  pattern: z.string().nullish(),
  timeStart: z.string().nullish(),
  timeEnd: z.string().nullish(),
  facilityDescr: z.string().nullish(),
  instructors: z.array(instructorSchema).nullish(),
});

export const classSectionSchema = z.object({
  ssrComponent: z.string().nullish(),
  section: z.string().nullish(),
  meetings: z.array(meetingSchema).nullish(),
});

export const enrollGroupSchema = z.object({
  unitsMinimum: z.number().nullish(),
  unitsMaximum: z.number().nullish(),
  gradingBasis: z.string().nullish(),
  gradingBasisShort: z.string().nullish(),
  classSections: z.array(classSectionSchema).nullish(),
});

export const classSchema = z.object({
  subject: z.string(),
  catalogNbr: z.string(),
  titleLong: z.string(),
  titleShort: z.string().nullish(),
  description: z.string().nullish(),
  enrollGroups: z.array(enrollGroupSchema).nullish(),
  catalogWhenOffered: z.string().nullish(),
  catalogBreadth: z.string().nullish(),
  catalogDistr: z.string().nullish(),
  catalogLang: z.string().nullish(),
  catalogForbiddenOverlaps: z.array(z.string()).nullish(),
  catalogPrereqCoreq: z.string().nullish(),
  catalogSatisfiesReq: z.string().nullish(),
  catalogPermission: z.string().nullish(),
  catalogCourseSubfield: z.string().nullish(),
  catalogOutcomeDesc: z.string().nullish(),
  acadCareer: z.string().nullish(),
  acadGroup: z.string().nullish(),
});

// Storage Types
export interface StoredCourse {
  subject: string;
  catalogNbr: string;
  titleLong: string;
  rosterSlug: string;
  rosterDescr: string;
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
export type InstructorResponse = z.infer<typeof instructorSchema>;
export type MeetingResponse = z.infer<typeof meetingSchema>;

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
