import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

const MAX_SOURCE_CHARS = 200_000;

function mapSource(r: any, questionCount = 0) {
  return {
    id: r.id,
    pathwayId: r.pathway_id,
    name: r.name,
    content: r.content,
    sourceType: r.source_type || "text",
    originalFilename: r.original_filename ?? null,
    pageCount: r.page_count ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
    questionCount,
  };
}

// Count how many cached questions in a pathway reference each source ID.
// Questions live as a JSON-encoded blob on `pathways.questions` and may carry
// a `sourceIds` array attached at generation time. Older cached questions
// won't have it; they contribute zero to all counts.
function countQuestionsBySource(questionsJson: string | null): Map<number, number> {
  const counts = new Map<number, number>();
  if (!questionsJson) return counts;
  let parsed: any;
  try { parsed = JSON.parse(questionsJson); } catch { return counts; }
  if (!Array.isArray(parsed)) return counts;
  for (const q of parsed) {
    const ids = q?.sourceIds;
    if (!Array.isArray(ids)) continue;
    for (const raw of ids) {
      const id = Number(raw);
      if (!Number.isFinite(id)) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

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
      "SELECT id, questions FROM pathways WHERE id = $1 AND user_id = $2",
      [pathwayId, userId],
    )).rows[0];
    if (!owns) { res.status(404).json({ error: "Pathway not found." }); return; }

    const result = await query(
      "SELECT id, pathway_id, name, content, source_type, original_filename, page_count, created_at, updated_at FROM pathway_sources WHERE user_id = $1 AND pathway_id = $2 ORDER BY created_at ASC",
      [userId, pathwayId],
    );

    const counts = countQuestionsBySource(owns.questions ?? null);
    res.json({ sources: result.rows.map((r) => mapSource(r, counts.get(Number(r.id)) ?? 0)) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/sources — add a source ──────────────────────────── */
router.post("/sources", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { pathwayId, name, content, sourceType, originalFilename, pageCount } = req.body as {
      pathwayId: number; name: string; content: string;
      sourceType?: string; originalFilename?: string | null; pageCount?: number | null;
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

    const normalizedType = sourceType === "pdf" ? "pdf" : "text";
    const fname = normalizedType === "pdf" && originalFilename ? String(originalFilename).slice(0, 255) : null;
    const pcount = normalizedType === "pdf" && Number.isFinite(Number(pageCount)) && Number(pageCount) > 0
      ? Math.floor(Number(pageCount))
      : null;

    const result = await query(
      "INSERT INTO pathway_sources (user_id, pathway_id, name, content, source_type, original_filename, page_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, pathway_id, name, content, source_type, original_filename, page_count, created_at, updated_at",
      [userId, Number(pathwayId), name.trim(), trimmedContent, normalizedType, fname, pcount],
    );

    // Invalidate any cached generated questions for this pathway so the next
    // quiz start regenerates against the updated source set.
    await query(
      "UPDATE pathways SET questions = NULL, resume_number = NULL WHERE id = $1 AND user_id = $2",
      [Number(pathwayId), userId],
    );

    const mapped = mapSource(result.rows[0]);
    res.json({
      ok: true,
      // Canonical mapped source so the client doesn't have to reconstruct it
      // (and stays in sync with any server-side normalization like truncation).
      source: mapped,
      // Kept for backwards compatibility with existing clients.
      id: mapped.id,
      createdAt: mapped.createdAt,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/sources/:id — rename or edit source content ────── */
router.patch("/sources/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const sourceId = Number(req.params.id);
    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      res.status(400).json({ error: "Invalid source id." });
      return;
    }

    const { name, content } = req.body as { name?: string; content?: string };

    const updates: string[] = [];
    const params: any[] = [];
    let trimmedContent: string | null = null;

    if (typeof name === "string") {
      if (!name.trim()) { res.status(400).json({ error: "Name cannot be empty." }); return; }
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (typeof content === "string") {
      if (!content.trim()) { res.status(400).json({ error: "Source content cannot be empty." }); return; }
      trimmedContent = content.length > MAX_SOURCE_CHARS ? content.slice(0, MAX_SOURCE_CHARS) : content;
      params.push(trimmedContent);
      updates.push(`content = $${params.length}`);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "Nothing to update. Provide name and/or content." });
      return;
    }

    updates.push("updated_at = NOW()");
    params.push(sourceId);
    params.push(userId);

    const sql = `UPDATE pathway_sources SET ${updates.join(", ")} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING id, pathway_id, name, content, source_type, original_filename, page_count, created_at, updated_at`;
    const result = await query(sql, params);

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Source not found." }); return;
    }

    const row = result.rows[0];

    // If the content changed, invalidate cached generated questions for this
    // pathway so the next quiz regenerates against the updated source.
    if (typeof content === "string") {
      await query(
        "UPDATE pathways SET questions = NULL, resume_number = NULL WHERE id = $1 AND user_id = $2",
        [row.pathway_id, userId],
      );
    }

    res.json({ ok: true, source: mapSource(row) });
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
      "DELETE FROM pathway_sources WHERE id = $1 AND user_id = $2 RETURNING pathway_id",
      [sourceId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Source not found." }); return;
    }

    // Invalidate cached generated questions for the affected pathway so the
    // next quiz start regenerates against the updated source set.
    const affectedPathwayId = result.rows[0]?.pathway_id;
    if (affectedPathwayId) {
      await query(
        "UPDATE pathways SET questions = NULL, resume_number = NULL WHERE id = $1 AND user_id = $2",
        [affectedPathwayId, userId],
      );
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
