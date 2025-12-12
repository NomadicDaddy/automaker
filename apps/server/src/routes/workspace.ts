/**
 * Workspace routes
 * Provides API endpoints for workspace directory management
 */

import { Router, type Request, type Response } from "express";
import fs from "fs/promises";
import path from "path";
import { addAllowedPath } from "../lib/security.js";

export function createWorkspaceRoutes(): Router {
  const router = Router();

  // Get workspace configuration status
  router.get("/config", async (_req: Request, res: Response) => {
    try {
      const workspaceDir = process.env.WORKSPACE_DIR;

      if (!workspaceDir) {
        res.json({
          success: true,
          configured: false,
        });
        return;
      }

      // Check if the directory exists
      try {
        const stats = await fs.stat(workspaceDir);
        if (!stats.isDirectory()) {
          res.json({
            success: true,
            configured: false,
            error: "WORKSPACE_DIR is not a valid directory",
          });
          return;
        }

        // Add workspace dir to allowed paths
        addAllowedPath(workspaceDir);

        res.json({
          success: true,
          configured: true,
          workspaceDir,
        });
      } catch {
        res.json({
          success: true,
          configured: false,
          error: "WORKSPACE_DIR path does not exist",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  });

  // List directories in workspace
  router.get("/directories", async (_req: Request, res: Response) => {
    try {
      const workspaceDir = process.env.WORKSPACE_DIR;

      if (!workspaceDir) {
        res.status(400).json({
          success: false,
          error: "WORKSPACE_DIR is not configured",
        });
        return;
      }

      // Check if directory exists
      try {
        await fs.stat(workspaceDir);
      } catch {
        res.status(400).json({
          success: false,
          error: "WORKSPACE_DIR path does not exist",
        });
        return;
      }

      // Add workspace dir to allowed paths
      addAllowedPath(workspaceDir);

      // Read directory contents
      const entries = await fs.readdir(workspaceDir, { withFileTypes: true });

      // Filter to directories only and map to result format
      const directories = entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => ({
          name: entry.name,
          path: path.join(workspaceDir, entry.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Add each directory to allowed paths
      directories.forEach((dir) => addAllowedPath(dir.path));

      res.json({
        success: true,
        directories,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
