import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ingestionService } from "./ingestion";
import { answerService } from "./answer-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/ping", async (req, res) => {
    const stats = await storage.getStats();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      stats,
    });
  });

  // Get all rosters
  app.get("/api/rosters", async (req, res) => {
    try {
      const rosters = await storage.getRosters();
      res.json({
        success: true,
        rosters,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get latest course offering
  app.get("/api/classes/latest", async (req, res) => {
    try {
      const { subject, catalog_nbr } = req.query;

      if (!subject || !catalog_nbr) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: subject and catalog_nbr",
        });
      }

      const course = await storage.getLatestCourse(
        subject as string,
        catalog_nbr as string
      );

      if (!course) {
        return res.status(404).json({
          success: false,
          error: `No course found for ${subject} ${catalog_nbr}`,
        });
      }

      res.json({
        success: true,
        course,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get course history across all rosters
  app.get("/api/classes/history", async (req, res) => {
    try {
      const { subject, catalog_nbr } = req.query;

      if (!subject || !catalog_nbr) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: subject and catalog_nbr",
        });
      }

      const history = await storage.getCourseHistory(
        subject as string,
        catalog_nbr as string
      );

      res.json({
        success: true,
        history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Natural language question answering
  app.post("/api/ask", async (req, res) => {
    try {
      const { question } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({
          success: false,
          error: "Missing or invalid question parameter",
        });
      }

      const answer = await answerService.answer(question);
      res.json(answer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Ingestion endpoints (for admin/testing)
  app.post("/api/admin/ingest", async (req, res) => {
    try {
      if (ingestionService.isRunning()) {
        return res.status(409).json({
          success: false,
          error: "Ingestion already in progress",
        });
      }

      // Start ingestion in background
      ingestionService.ingestAll().catch((error) => {
        console.error("Ingestion error:", error);
      });

      res.json({
        success: true,
        message: "Ingestion started",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/admin/ingest/progress", async (req, res) => {
    try {
      const progress = ingestionService.getProgress();
      res.json({
        success: true,
        progress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
