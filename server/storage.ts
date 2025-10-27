import { StoredCourse, Roster, Subject } from "@shared/schema";

export interface IStorage {
  // Roster operations
  storeRoster(roster: Roster): Promise<void>;
  getRosters(): Promise<Roster[]>;
  getLatestRoster(): Promise<Roster | undefined>;
  
  // Subject operations
  storeSubject(subject: Subject): Promise<void>;
  getSubjects(rosterSlug?: string): Promise<Subject[]>;
  
  // Course operations
  storeCourse(course: StoredCourse): Promise<void>;
  storeCourses(courses: StoredCourse[]): Promise<void>;
  getCourse(subject: string, catalogNbr: string, rosterSlug?: string): Promise<StoredCourse | undefined>;
  getCourseHistory(subject: string, catalogNbr: string): Promise<StoredCourse[]>;
  getLatestCourse(subject: string, catalogNbr: string): Promise<StoredCourse | undefined>;
  getCoursesBySubject(subject: string, limit?: number): Promise<StoredCourse[]>;
  getAllCourses(): Promise<StoredCourse[]>;
  
  // Utility
  clear(): Promise<void>;
  getStats(): Promise<{ rosters: number; subjects: number; courses: number }>;
}

export class MemStorage implements IStorage {
  private rosters: Map<string, Roster> = new Map();
  private subjects: Map<string, Subject> = new Map();
  private courses: Map<string, StoredCourse> = new Map();

  private getCourseKey(subject: string, catalogNbr: string, rosterSlug: string): string {
    return `${subject}-${catalogNbr}-${rosterSlug}`;
  }

  async storeRoster(roster: Roster): Promise<void> {
    this.rosters.set(roster.slug, roster);
  }

  async getRosters(): Promise<Roster[]> {
    return Array.from(this.rosters.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.termCode - a.termCode;
      });
  }

  async getLatestRoster(): Promise<Roster | undefined> {
    const rosters = await this.getRosters();
    return rosters[0];
  }

  async storeSubject(subject: Subject): Promise<void> {
    const key = `${subject.rosterSlug}-${subject.code}`;
    this.subjects.set(key, subject);
  }

  async getSubjects(rosterSlug?: string): Promise<Subject[]> {
    const subjects = Array.from(this.subjects.values());
    if (rosterSlug) {
      return subjects.filter(s => s.rosterSlug === rosterSlug);
    }
    return subjects;
  }

  async storeCourse(course: StoredCourse): Promise<void> {
    const key = this.getCourseKey(course.subject, course.catalogNbr, course.rosterSlug);
    this.courses.set(key, course);
  }

  async storeCourses(courses: StoredCourse[]): Promise<void> {
    for (const course of courses) {
      await this.storeCourse(course);
    }
  }

  async getCourse(subject: string, catalogNbr: string, rosterSlug?: string): Promise<StoredCourse | undefined> {
    if (rosterSlug) {
      const key = this.getCourseKey(subject, catalogNbr, rosterSlug);
      return this.courses.get(key);
    }
    
    // Find latest if no roster specified
    return this.getLatestCourse(subject, catalogNbr);
  }

  async getCourseHistory(subject: string, catalogNbr: string): Promise<StoredCourse[]> {
    const courses = Array.from(this.courses.values())
      .filter(c => c.subject === subject && c.catalogNbr === catalogNbr);
    
    // Sort by roster (latest first)
    return courses.sort((a, b) => {
      const aRoster = this.rosters.get(a.rosterSlug);
      const bRoster = this.rosters.get(b.rosterSlug);
      if (!aRoster || !bRoster) return 0;
      if (aRoster.year !== bRoster.year) return bRoster.year - aRoster.year;
      return bRoster.termCode - aRoster.termCode;
    });
  }

  async getLatestCourse(subject: string, catalogNbr: string): Promise<StoredCourse | undefined> {
    const history = await this.getCourseHistory(subject, catalogNbr);
    return history[0];
  }

  async getCoursesBySubject(subject: string, limit: number = 5): Promise<StoredCourse[]> {
    const courses = Array.from(this.courses.values())
      .filter(c => c.subject === subject);
    
    // Get unique courses (latest version of each)
    const uniqueCourses = new Map<string, StoredCourse>();
    for (const course of courses) {
      const key = `${course.subject}-${course.catalogNbr}`;
      const existing = uniqueCourses.get(key);
      if (!existing) {
        uniqueCourses.set(key, course);
      } else {
        const existingRoster = this.rosters.get(existing.rosterSlug);
        const courseRoster = this.rosters.get(course.rosterSlug);
        if (existingRoster && courseRoster) {
          if (courseRoster.year > existingRoster.year || 
              (courseRoster.year === existingRoster.year && courseRoster.termCode > existingRoster.termCode)) {
            uniqueCourses.set(key, course);
          }
        }
      }
    }
    
    return Array.from(uniqueCourses.values()).slice(0, limit);
  }

  async getAllCourses(): Promise<StoredCourse[]> {
    return Array.from(this.courses.values());
  }

  async clear(): Promise<void> {
    this.rosters.clear();
    this.subjects.clear();
    this.courses.clear();
  }

  async getStats(): Promise<{ rosters: number; subjects: number; courses: number }> {
    return {
      rosters: this.rosters.size,
      subjects: this.subjects.size,
      courses: this.courses.size,
    };
  }
}

export const storage = new MemStorage();
