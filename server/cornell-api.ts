import PQueue from "p-queue";
import fetch from "node-fetch";
import { RosterResponse, SubjectResponse, ClassResponse, rosterSchema, subjectSchema, classSchema } from "@shared/schema";

const CORNELL_API_BASE = "https://classes.cornell.edu/api/2.0";
const RATE_LIMIT_MS = 1000; // 1 request per second
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export class CornellAPIClient {
  private queue: PQueue;

  constructor() {
    // Rate limit: 1 request per second
    this.queue = new PQueue({
      interval: RATE_LIMIT_MS,
      intervalCap: 1,
      timeout: 30000, // 30 second timeout per request
    });
  }

  private async fetchWithRetry<T>(
    url: string,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Cornell-Classes-QA-Bot/1.0",
        },
      });

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          // Rate limited, wait and retry
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          return this.fetchWithRetry<T>(url, retries - 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (retries > 0 && error instanceof Error) {
        // Network error, retry
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.fetchWithRetry<T>(url, retries - 1);
      }
      throw error;
    }
  }

  async getRosters(): Promise<RosterResponse[]> {
    return this.queue.add(async () => {
      const url = `${CORNELL_API_BASE}/config/rosters.json`;
      const response = await this.fetchWithRetry<{ data: { rosters: RosterResponse[] } }>(url);
      return response.data.rosters.map(roster => rosterSchema.parse(roster));
    }) as Promise<RosterResponse[]>;
  }

  async getSubjects(roster: string): Promise<SubjectResponse[]> {
    return this.queue.add(async () => {
      const url = `${CORNELL_API_BASE}/config/subjects.json?roster=${roster}`;
      const response = await this.fetchWithRetry<{ data: { subjects: SubjectResponse[] } }>(url);
      return response.data.subjects.map(subject => subjectSchema.parse(subject));
    }) as Promise<SubjectResponse[]>;
  }

  async getClasses(roster: string, subject: string): Promise<ClassResponse[]> {
    return this.queue.add(async () => {
      const url = `${CORNELL_API_BASE}/search/classes.json?roster=${roster}&subject=${subject}`;
      const response = await this.fetchWithRetry<{ data: { classes: ClassResponse[] } }>(url);
      
      if (!response.data || !response.data.classes) {
        return [];
      }
      
      return response.data.classes.map(cls => {
        try {
          return classSchema.parse(cls);
        } catch (error) {
          console.error(`Failed to parse class ${subject} in ${roster}:`, error);
          return null;
        }
      }).filter((cls): cls is ClassResponse => cls !== null);
    }) as Promise<ClassResponse[]>;
  }

  async getClass(roster: string, subject: string, catalogNbr: string): Promise<ClassResponse | null> {
    const classes = await this.getClasses(roster, subject);
    return classes.find(cls => cls.catalogNbr === catalogNbr) || null;
  }

  getQueueSize(): number {
    return this.queue.size + this.queue.pending;
  }

  async waitForQueue(): Promise<void> {
    await this.queue.onIdle();
  }
}

export const cornellAPI = new CornellAPIClient();
