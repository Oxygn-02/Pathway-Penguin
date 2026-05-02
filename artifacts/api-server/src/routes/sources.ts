import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

const MAX_SOURCE_CHARS = 200_000;

/* ── GET /api/sources?pathwayId=X — list sources for a pathway ── */
router.get("/sources", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const pathwayId = Number(req.query.pathwayId);
    if (!pathwayId || Number.isNaN(pathwayId)) {
      res.status(400).json({ error: "pathwayId query parameter is required." });
      return;
    }

    const owns = (await query(
      "SELECT id FROM pathways WHERE id = $1 AND user_id = $2",
      [pathwayId, userId],
    )).rows[0];
    if (!owns) { res.status(404).json({ error: "Pathway not found." }); return; }

    const result = await query(
      "SELECT id, pathway_id, name, content, created_at FROM pathway_sources WHERE user_id = $1 AND pathway_id = $2 ORDER BY created_at ASC",
      [userId, pathwayId],
    );

    res.json({
      sources: result.rows.map((r) => ({
        id: r.id,
        pathwayId: r.pathway_id,
        name: r.name,
        content: r.content,
        createdAt: r.created_at,
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/sources — add a source ──────────────────────────── */
router.post("/sources", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { pathwayId, name, content } = req.body as {
      pathwayId: number; name: string; content: string;
    };

    if (!pathwayId || Number.isNaN(Number(pathwayId))) {
      res.status(400).json({ error: "pathwayId is required." }); return;
    }
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Name is required." }); return;
    }
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Source content cannot be empty." }); return;
    }

    const owns = (await query(
      "SELECT id FROM pathways WHERE id = $1 AND user_id = $2",
      [Number(pathwayId), userId],
    )).rows[0];
    if (!owns) { res.status(404).json({ error: "Pathway not found." }); return; }

    const trimmedContent = content.length > MAX_SOURCE_CHARS
      ? content.slice(0, MAX_SOURCE_CHARS)
      : content;

    const result = await query(
      "INSERT INTO pathway_sources (user_id, pathway_id, name, content) VALUES ($1, $2, $3, $4) RETURNING id, created_at",
      [userId, Number(pathwayId), name.trim(), trimmedContent],
    );

    res.json({
      ok: true,
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/sources/:id — delete a source ──────────────────── */
router.delete("/sources/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const sourceId = Number(req.params.id);
    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      res.status(400).json({ error: "Invalid source id." });
      return;
    }

    const result = await query(
      "DELETE FROM pathway_sources WHERE id = $1 AND user_id = $2",
      [sourceId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Source not found." }); return;
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
