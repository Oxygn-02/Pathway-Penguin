import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { serverError } from "../lib/http.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

function mapQuiz(r: any) {
  return {
    id: r.id,
    pathwayId: r.pathway_id,
    name: r.name,
    sourceIds: typeof r.source_ids === "string" ? JSON.parse(r.source_ids) : (r.source_ids ?? []),
    questions: typeof r.questions === "string" ? JSON.parse(r.questions) : (r.questions ?? []),
    createdAt: r.created_at,
  };
}

/* ── GET /api/source-quizzes?pathwayId=X ───────────────────────── */
router.get("/source-quizzes", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const pathwayId = Number(req.query.pathwayId);
    if (!pathwayId || Number.isNaN(pathwayId)) {
      res.status(400).json({ error: "pathwayId query parameter is required." }); return;
    }
    const owns = (await query(
      "SELECT id FROM pathways WHERE id = $1 AND user_id = $2",
      [pathwayId, userId],
    )).rows[0];
    if (!owns) { res.status(404).json({ error: "Pathway not found." }); return; }

    const result = await query(
      "SELECT id, pathway_id, name, source_ids, questions, created_at FROM source_quizzes WHERE user_id = $1 AND pathway_id = $2 ORDER BY created_at DESC",
      [userId, pathwayId],
    );
    res.json({ quizzes: result.rows.map(mapQuiz) });
  } catch (e: any) {
    serverError(res, e, "sourceQuizzes");
  }
});

/* ── POST /api/source-quizzes — save a generated source quiz ────── */
router.post("/source-quizzes", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { pathwayId, name, sourceIds, questions } = req.body as {
      pathwayId: number; name: string; sourceIds: number[]; questions: any[];
    };
    if (!pathwayId || Number.isNaN(Number(pathwayId))) {
      res.status(400).json({ error: "pathwayId is required." }); return;
    }
    if (!name?.trim()) { res.status(400).json({ error: "Name is required." }); return; }
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "questions array is required." }); return;
    }
    const owns = (await query(
      "SELECT id FROM pathways WHERE id = $1 AND user_id = $2",
      [Number(pathwayId), userId],
    )).rows[0];
    if (!owns) { res.status(404).json({ error: "Pathway not found." }); return; }

    const result = await query(
      `INSERT INTO source_quizzes (user_id, pathway_id, name, source_ids, questions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, pathway_id, name, source_ids, questions, created_at`,
      [
        userId,
        Number(pathwayId),
        name.trim(),
        JSON.stringify(Array.isArray(sourceIds) ? sourceIds : []),
        JSON.stringify(questions),
      ],
    );
    res.json({ ok: true, quiz: mapQuiz(result.rows[0]) });
  } catch (e: any) {
    serverError(res, e, "sourceQuizzes");
  }
});

/* ── DELETE /api/source-quizzes/:id ────────────────────────────── */
router.delete("/source-quizzes/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid quiz id." }); return;
    }
    const result = await query(
      "DELETE FROM source_quizzes WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Quiz not found." }); return;
    }
    res.json({ ok: true });
  } catch (e: any) {
    serverError(res, e, "sourceQuizzes");
  }
});

export default router;
