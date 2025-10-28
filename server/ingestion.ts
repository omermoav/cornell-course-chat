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
    const gradingBases = new Set<string>();
    let unitsMin: number | undefined;
    let unitsMax: number | undefined;

    const instructorSet = new Set<string>();
    const meetingPatterns: Array<{ days: string; timeStart: string; timeEnd: string }> = [];

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

        if (group.classSections) {
          for (const section of group.classSections) {
            if (section.meetings) {
              for (const meeting of section.meetings) {
                if (meeting.pattern && meeting.timeStart && meeting.timeEnd) {
                  const patternKey = `${meeting.pattern}-${meeting.timeStart}-${meeting.timeEnd}`;
                  const exists = meetingPatterns.some(
                    p => `${p.days}-${p.timeStart}-${p.timeEnd}` === patternKey
                  );
                  
                  if (!exists) {
                    meetingPatterns.push({
                      days: meeting.pattern,
                      timeStart: meeting.timeStart,
                      timeEnd: meeting.timeEnd,
                    });
                  }
                }

                if (meeting.instructors) {
                  for (const instructor of meeting.instructors) {
                    if (instructor.firstName && instructor.lastName) {
                      const fullName = `${instructor.firstName} ${instructor.lastName}`;
                      instructorSet.add(fullName);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      subject: classData.subject,
      catalogNbr: classData.catalogNbr,
      titleLong: classData.titleLong,
      rosterSlug,
      rosterDescr,
      
      // Basic info
      description: classData.description || undefined,
      gradingBasis: gradingBases.size === 1 ? Array.from(gradingBases)[0] : undefined,
      unitsMinimum: unitsMin,
      unitsMaximum: unitsMax,
      
      // Schedule and logistics
      instructors: instructorSet.size > 0 ? Array.from(instructorSet) : undefined,
      meetingPatterns: meetingPatterns.length > 0 ? meetingPatterns : undefined,
      
      // Academic requirements (from catalog)
      prerequisites: classData.catalogPrereqCoreq || undefined,
      outcomes: classData.catalogOutcomeDesc || undefined,
      satisfiesRequirements: classData.catalogSatisfiesReq || undefined,
      breadthRequirements: classData.catalogBreadth || undefined,
      distributionCategories: classData.catalogDistr || undefined,
      forbiddenOverlaps: classData.catalogForbiddenOverlaps
        ? (typeof classData.catalogForbiddenOverlaps === 'string' 
            ? [classData.catalogForbiddenOverlaps]
            : classData.catalogForbiddenOverlaps.length > 0 
              ? classData.catalogForbiddenOverlaps 
              : undefined)
        : undefined,
      permissionRequired: classData.catalogPermission || undefined,
      
      // History
      lastTermsOffered: classData.catalogWhenOffered || undefined,
      
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
      
      const rostersData = await cornellAPI.getRosters();
      this.progress.totalRosters = rostersData.length;
      console.log(`Found ${rostersData.length} rosters`);

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

      // Process rosters in reverse order (newest first) to get recent courses sooner
      for (const rosterData of [...rostersData].reverse()) {
        this.progress.currentRoster = rosterData.slug;
        console.log(`\nProcessing roster: ${rosterData.descr} (${rosterData.slug})`);

        try {
          const subjectsData = await cornellAPI.getSubjects(rosterData.slug);
          console.log(`  Found ${subjectsData.length} subjects`);
          this.progress.totalSubjects += subjectsData.length;

          for (const subjectData of subjectsData) {
            const subject: Subject = {
              code: subjectData.value,
              name: subjectData.descr,
              rosterSlug: rosterData.slug,
            };
            await storage.storeSubject(subject);
          }

          for (const subjectData of subjectsData) {
            this.progress.currentSubject = subjectData.value;
            console.log(`    Fetching classes for ${subjectData.value}...`);

            try {
              const classes = await cornellAPI.getClasses(rosterData.slug, subjectData.value);
              console.log(`      Found ${classes.length} classes`);

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

  async ingestPriority(prioritySubjects: string[]): Promise<void> {
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
      console.log(`Starting PRIORITY ingestion for subjects: ${prioritySubjects.join(', ')}`);
      
      const rostersData = await cornellAPI.getRosters();
      this.progress.totalRosters = rostersData.length;
      console.log(`Found ${rostersData.length} rosters`);

      // Store all rosters
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

      // Process rosters in reverse order (newest first) but ONLY priority subjects
      for (const rosterData of [...rostersData].reverse()) {
        this.progress.currentRoster = rosterData.slug;
        console.log(`\nProcessing roster: ${rosterData.descr} (${rosterData.slug})`);

        try {
          const subjectsData = await cornellAPI.getSubjects(rosterData.slug);
          
          // Filter to only priority subjects
          const prioritySubjectsInRoster = subjectsData.filter(s => 
            prioritySubjects.includes(s.value)
          );
          
          console.log(`  Found ${prioritySubjectsInRoster.length} priority subjects (${subjectsData.length} total)`);
          this.progress.totalSubjects += prioritySubjectsInRoster.length;

          // Store priority subjects
          for (const subjectData of prioritySubjectsInRoster) {
            const subject: Subject = {
              code: subjectData.value,
              name: subjectData.descr,
              rosterSlug: rosterData.slug,
            };
            await storage.storeSubject(subject);
          }

          // Ingest classes for priority subjects only
          for (const subjectData of prioritySubjectsInRoster) {
            this.progress.currentSubject = subjectData.value;
            console.log(`    Fetching classes for ${subjectData.value}...`);

            try {
              const classes = await cornellAPI.getClasses(rosterData.slug, subjectData.value);
              console.log(`      Found ${classes.length} classes`);

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

      const stats = await storage.getStats();
      console.log("\nPriority ingestion complete!");
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
