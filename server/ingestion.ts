import { cornellAPI } from "./cornell-api";
import { storage } from "./storage";
import { Roster, Subject, StoredCourse, ClassResponse } from "@shared/schema";

export class IngestionService {
  private isIngesting = false;
  private progress = {
    currentRoster: "",
    currentSubject: "",
    rostersCompleted: 0,
    subjectsCompleted: 0,
    coursesStored: 0,
    totalRosters: 0,
    totalSubjects: 0,
    errors: [] as string[],
  };

  private parseRosterSlug(slug: string): { year: number; termCode: number } {
    // Parse roster slugs like "FA25", "SP24", "SU23", "WI24"
    const term = slug.substring(0, 2);
    const yearStr = slug.substring(2);
    const year = 2000 + parseInt(yearStr, 10);
    
    const termCodes: Record<string, number> = {
      WI: 1,
      SP: 2,
      SU: 3,
      FA: 4,
    };
    
    return {
      year,
      termCode: termCodes[term] || 0,
    };
  }

  private extractCourseData(classData: ClassResponse, rosterSlug: string, rosterDescr: string): StoredCourse {
    // Extract grading basis (could vary by section)
    const gradingBases = new Set<string>();
    let unitsMin: number | undefined;
    let unitsMax: number | undefined;

    if (classData.enrollGroups) {
      for (const group of classData.enrollGroups) {
        if (group.gradingBasis) {
          gradingBases.add(group.gradingBasis);
        }
        if (group.unitsMinimum !== undefined) {
          unitsMin = unitsMin === undefined ? group.unitsMinimum : Math.min(unitsMin, group.unitsMinimum);
        }
        if (group.unitsMaximum !== undefined) {
          unitsMax = unitsMax === undefined ? group.unitsMaximum : Math.max(unitsMax, group.unitsMaximum);
        }
      }
    }

    return {
      subject: classData.subject,
      catalogNbr: classData.catalogNbr,
      titleLong: classData.titleLong,
      rosterSlug,
      rosterDescr,
      gradingBasis: gradingBases.size === 1 ? Array.from(gradingBases)[0] : undefined,
      unitsMinimum: unitsMin,
      unitsMaximum: unitsMax,
      instructors: undefined, // Not in basic class data
      meetingPatterns: undefined, // Not in basic class data
      lastTermsOffered: classData.catalogWhenOffered,
      rawData: JSON.stringify(classData),
    };
  }

  async ingestAll(): Promise<void> {
    if (this.isIngesting) {
      throw new Error("Ingestion already in progress");
    }

    this.isIngesting = true;
    this.progress = {
      currentRoster: "",
      currentSubject: "",
      rostersCompleted: 0,
      subjectsCompleted: 0,
      coursesStored: 0,
      totalRosters: 0,
      totalSubjects: 0,
      errors: [],
    };

    try {
      console.log("Starting Cornell Class Roster ingestion...");
      
      // Step 1: Fetch all rosters
      console.log("Fetching rosters...");
      const rostersData = await cornellAPI.getRosters();
      this.progress.totalRosters = rostersData.length;
      console.log(`Found ${rostersData.length} rosters`);

      // Store rosters
      for (const rosterData of rostersData) {
        const parsed = this.parseRosterSlug(rosterData.slug);
        const roster: Roster = {
          slug: rosterData.slug,
          descr: rosterData.descr,
          year: parsed.year,
          termCode: parsed.termCode,
        };
        await storage.storeRoster(roster);
      }

      // Step 2: For each roster, fetch subjects and classes
      for (const rosterData of rostersData) {
        this.progress.currentRoster = rosterData.slug;
        console.log(`\nProcessing roster: ${rosterData.descr} (${rosterData.slug})`);

        try {
          // Fetch subjects for this roster
          const subjectsData = await cornellAPI.getSubjects(rosterData.slug);
          console.log(`  Found ${subjectsData.length} subjects`);
          this.progress.totalSubjects += subjectsData.length;

          // Store subjects
          for (const subjectData of subjectsData) {
            const subject: Subject = {
              code: subjectData.value,
              name: subjectData.descr,
              rosterSlug: rosterData.slug,
            };
            await storage.storeSubject(subject);
          }

          // Fetch classes for each subject
          for (const subjectData of subjectsData) {
            this.progress.currentSubject = subjectData.value;
            console.log(`    Fetching classes for ${subjectData.value}...`);

            try {
              const classes = await cornellAPI.getClasses(rosterData.slug, subjectData.value);
              console.log(`      Found ${classes.length} classes`);

              // Store each class
              for (const classData of classes) {
                const course = this.extractCourseData(classData, rosterData.slug, rosterData.descr);
                await storage.storeCourse(course);
                this.progress.coursesStored++;
              }

              this.progress.subjectsCompleted++;
            } catch (error) {
              const errorMsg = `Error fetching classes for ${subjectData.value} in ${rosterData.slug}: ${error}`;
              console.error(`      ${errorMsg}`);
              this.progress.errors.push(errorMsg);
            }
          }

          this.progress.rostersCompleted++;
        } catch (error) {
          const errorMsg = `Error processing roster ${rosterData.slug}: ${error}`;
          console.error(`  ${errorMsg}`);
          this.progress.errors.push(errorMsg);
        }
      }

      // Final stats
      const stats = await storage.getStats();
      console.log("\nIngestion complete!");
      console.log(`  Rosters: ${stats.rosters}`);
      console.log(`  Subjects: ${stats.subjects}`);
      console.log(`  Courses: ${stats.courses}`);
      if (this.progress.errors.length > 0) {
        console.log(`  Errors: ${this.progress.errors.length}`);
      }
    } finally {
      this.isIngesting = false;
    }
  }

  getProgress() {
    return { ...this.progress, isIngesting: this.isIngesting };
  }

  isRunning(): boolean {
    return this.isIngesting;
  }
}

export const ingestionService = new IngestionService();
