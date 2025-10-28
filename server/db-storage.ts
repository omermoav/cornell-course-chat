import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, sql, like } from "drizzle-orm";
import { StoredCourse, Roster, Subject, rostersTable, subjectsTable, coursesTable } from "@shared/schema";
import { IStorage } from "./storage";

const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

export class DBStorage implements IStorage {
  // Roster operations
  async storeRoster(roster: Roster): Promise<void> {
    await db.insert(rostersTable)
      .values({
        slug: roster.slug,
        descr: roster.descr,
        year: roster.year,
        termCode: roster.termCode,
      })
      .onConflictDoUpdate({
        target: rostersTable.slug,
        set: {
          descr: roster.descr,
          year: roster.year,
          termCode: roster.termCode,
        },
      });
  }

  async getRosters(): Promise<Roster[]> {
    const results = await db.select().from(rostersTable);
    return results
      .map(r => ({
        slug: r.slug,
        descr: r.descr,
        year: r.year,
        termCode: r.termCode,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.termCode - a.termCode;
      });
  }

  async getLatestRoster(): Promise<Roster | undefined> {
    const rosters = await this.getRosters();
    return rosters[0];
  }

  // Subject operations
  async storeSubject(subject: Subject): Promise<void> {
    await db.insert(subjectsTable)
      .values({
        code: subject.code,
        name: subject.name,
        rosterSlug: subject.rosterSlug,
      })
      .onConflictDoNothing();
  }

  async getSubjects(rosterSlug?: string): Promise<Subject[]> {
    const results = rosterSlug
      ? await db.select().from(subjectsTable).where(eq(subjectsTable.rosterSlug, rosterSlug))
      : await db.select().from(subjectsTable);
    
    return results.map(s => ({
      code: s.code,
      name: s.name,
      rosterSlug: s.rosterSlug,
    }));
  }

  // Course operations
  async storeCourse(course: StoredCourse): Promise<void> {
    await db.insert(coursesTable)
      .values({
        subject: course.subject,
        catalogNbr: course.catalogNbr,
        titleLong: course.titleLong,
        rosterSlug: course.rosterSlug,
        rosterDescr: course.rosterDescr,
        description: course.description,
        gradingBasis: course.gradingBasis,
        unitsMinimum: course.unitsMinimum !== undefined ? String(course.unitsMinimum) : undefined,
        unitsMaximum: course.unitsMaximum !== undefined ? String(course.unitsMaximum) : undefined,
        instructors: course.instructors,
        meetingPatterns: course.meetingPatterns,
        prerequisites: course.prerequisites,
        outcomes: course.outcomes,
        satisfiesRequirements: course.satisfiesRequirements,
        breadthRequirements: course.breadthRequirements,
        distributionCategories: course.distributionCategories,
        forbiddenOverlaps: course.forbiddenOverlaps,
        permissionRequired: course.permissionRequired,
        lastTermsOffered: course.lastTermsOffered,
        rawData: course.rawData,
      })
      .onConflictDoNothing();
  }

  async storeCourses(courses: StoredCourse[]): Promise<void> {
    if (courses.length === 0) return;
    
    // Batch insert in chunks of 100 for better performance
    const chunkSize = 100;
    for (let i = 0; i < courses.length; i += chunkSize) {
      const chunk = courses.slice(i, i + chunkSize);
      await db.insert(coursesTable)
        .values(chunk.map(course => ({
          subject: course.subject,
          catalogNbr: course.catalogNbr,
          titleLong: course.titleLong,
          rosterSlug: course.rosterSlug,
          rosterDescr: course.rosterDescr,
          description: course.description,
          gradingBasis: course.gradingBasis,
          unitsMinimum: course.unitsMinimum !== undefined ? String(course.unitsMinimum) : undefined,
          unitsMaximum: course.unitsMaximum !== undefined ? String(course.unitsMaximum) : undefined,
          instructors: course.instructors,
          meetingPatterns: course.meetingPatterns,
          prerequisites: course.prerequisites,
          outcomes: course.outcomes,
          satisfiesRequirements: course.satisfiesRequirements,
          breadthRequirements: course.breadthRequirements,
          distributionCategories: course.distributionCategories,
          forbiddenOverlaps: course.forbiddenOverlaps,
          permissionRequired: course.permissionRequired,
          lastTermsOffered: course.lastTermsOffered,
          rawData: course.rawData,
        })))
        .onConflictDoNothing();
    }
  }

  async getCourse(subject: string, catalogNbr: string, rosterSlug?: string): Promise<StoredCourse | undefined> {
    if (rosterSlug) {
      const results = await db.select()
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.subject, subject),
            eq(coursesTable.catalogNbr, catalogNbr),
            eq(coursesTable.rosterSlug, rosterSlug)
          )
        )
        .limit(1);
      
      return results[0] ? this.mapDbCourseToStoredCourse(results[0]) : undefined;
    }
    
    return this.getLatestCourse(subject, catalogNbr);
  }

  async getCourseHistory(subject: string, catalogNbr: string): Promise<StoredCourse[]> {
    const results = await db.select()
      .from(coursesTable)
      .where(
        and(
          eq(coursesTable.subject, subject),
          eq(coursesTable.catalogNbr, catalogNbr)
        )
      );
    
    const courses = results.map(r => this.mapDbCourseToStoredCourse(r));
    const rosters = await this.getRosters();
    const rosterMap = new Map(rosters.map(r => [r.slug, r]));
    
    return courses.sort((a, b) => {
      const aRoster = rosterMap.get(a.rosterSlug);
      const bRoster = rosterMap.get(b.rosterSlug);
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
    const results = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.subject, subject));
    
    const courses = results.map(r => this.mapDbCourseToStoredCourse(r));
    const rosters = await this.getRosters();
    const rosterMap = new Map(rosters.map(r => [r.slug, r]));
    
    // Get unique courses (latest version of each)
    const uniqueCourses = new Map<string, StoredCourse>();
    for (const course of courses) {
      const key = `${course.subject}-${course.catalogNbr}`;
      const existing = uniqueCourses.get(key);
      if (!existing) {
        uniqueCourses.set(key, course);
      } else {
        const existingRoster = rosterMap.get(existing.rosterSlug);
        const courseRoster = rosterMap.get(course.rosterSlug);
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
    const results = await db.select().from(coursesTable);
    return results.map(r => this.mapDbCourseToStoredCourse(r));
  }

  async searchByTitle(titleQuery: string): Promise<StoredCourse[]> {
    const query = titleQuery.toLowerCase();
    
    // Use ILIKE for case-insensitive search
    const results = await db.select()
      .from(coursesTable)
      .where(sql`LOWER(${coursesTable.titleLong}) LIKE ${`%${query}%`}`);
    
    const courses = results.map(r => this.mapDbCourseToStoredCourse(r));
    const rosters = await this.getRosters();
    const rosterMap = new Map(rosters.map(r => [r.slug, r]));
    
    // Get unique courses (latest version of each)
    const uniqueCourses = new Map<string, StoredCourse>();
    for (const course of courses) {
      const key = `${course.subject}-${course.catalogNbr}`;
      const existing = uniqueCourses.get(key);
      if (!existing) {
        uniqueCourses.set(key, course);
      } else {
        const existingRoster = rosterMap.get(existing.rosterSlug);
        const courseRoster = rosterMap.get(course.rosterSlug);
        if (existingRoster && courseRoster) {
          if (courseRoster.year > existingRoster.year || 
              (courseRoster.year === existingRoster.year && courseRoster.termCode > existingRoster.termCode)) {
            uniqueCourses.set(key, course);
          }
        }
      }
    }
    
    // Sort by relevance (exact match first, then alphabetical)
    return Array.from(uniqueCourses.values()).sort((a, b) => {
      const aTitle = a.titleLong?.toLowerCase() || '';
      const bTitle = b.titleLong?.toLowerCase() || '';
      
      // Exact match first
      if (aTitle === query && bTitle !== query) return -1;
      if (bTitle === query && aTitle !== query) return 1;
      
      // Then starts with
      const aStarts = aTitle.startsWith(query);
      const bStarts = bTitle.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Finally alphabetical
      return aTitle.localeCompare(bTitle);
    });
  }

  async clear(): Promise<void> {
    await db.delete(coursesTable);
    await db.delete(subjectsTable);
    await db.delete(rostersTable);
  }

  async getStats(): Promise<{ rosters: number; subjects: number; courses: number }> {
    const [rostersCount] = await db.select({ count: sql<number>`count(*)` }).from(rostersTable);
    const [subjectsCount] = await db.select({ count: sql<number>`count(*)` }).from(subjectsTable);
    const [coursesCount] = await db.select({ count: sql<number>`count(*)` }).from(coursesTable);
    
    return {
      rosters: Number(rostersCount.count),
      subjects: Number(subjectsCount.count),
      courses: Number(coursesCount.count),
    };
  }

  private mapDbCourseToStoredCourse(dbCourse: any): StoredCourse {
    return {
      subject: dbCourse.subject,
      catalogNbr: dbCourse.catalogNbr,
      titleLong: dbCourse.titleLong,
      rosterSlug: dbCourse.rosterSlug,
      rosterDescr: dbCourse.rosterDescr,
      description: dbCourse.description || undefined,
      gradingBasis: dbCourse.gradingBasis || undefined,
      unitsMinimum: dbCourse.unitsMinimum ? parseFloat(dbCourse.unitsMinimum) : undefined,
      unitsMaximum: dbCourse.unitsMaximum ? parseFloat(dbCourse.unitsMaximum) : undefined,
      instructors: dbCourse.instructors || undefined,
      meetingPatterns: dbCourse.meetingPatterns || undefined,
      prerequisites: dbCourse.prerequisites || undefined,
      outcomes: dbCourse.outcomes || undefined,
      satisfiesRequirements: dbCourse.satisfiesRequirements || undefined,
      breadthRequirements: dbCourse.breadthRequirements || undefined,
      distributionCategories: dbCourse.distributionCategories || undefined,
      forbiddenOverlaps: dbCourse.forbiddenOverlaps || undefined,
      permissionRequired: dbCourse.permissionRequired || undefined,
      lastTermsOffered: dbCourse.lastTermsOffered || undefined,
      rawData: dbCourse.rawData,
    };
  }
}
