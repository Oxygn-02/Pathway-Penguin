import { Router, type IRouter, Request, Response } from "express";
import { query } from "../db.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

const router: IRouter = Router();

const VALID_PRIORITIES = ["red", "orange", "yellow", "green"];
const PRIORITY_ORDER: Record<string, number> = { red: 1, orange: 2, yellow: 3, green: 4 };

/* ── GET /api/exams — all exams with their papers ─────────────── */
router.get("/exams", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;

    const examsResult = await query(
      "SELECT id, subject, exam_date, priority, created_at FROM exams WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );

    const papersResult = await query(
      "SELECT id, exam_id, name, pathway_id, topic_ids FROM exam_papers WHERE user_id = $1 ORDER BY created_at ASC",
      [userId],
    );

    const papersByExam: Record<number, any[]> = {};
    for (const p of papersResult.rows) {
      if (!papersByExam[p.exam_id]) papersByExam[p.exam_id] = [];
      papersByExam[p.exam_id].push({
        id: p.id,
        name: p.name,
        pathwayId: p.pathway_id ?? null,
        topicIds: (() => { try { return JSON.parse(p.topic_ids || "[]"); } catch { return []; } })(),
      });
    }

    const exams = examsResult.rows.map((e) => ({
      id: e.id,
      subject: e.subject,
      examDate: e.exam_date,
      priority: e.priority,
      createdAt: e.created_at,
      papers: papersByExam[e.id] ?? [],
    }));

    exams.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    });

    res.json({ exams });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/exams — create an exam ────────────────────────── */
router.post("/exams", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const { subject, examDate, priority } = req.body as {
      subject: string; examDate: string; priority: string;
    };

    if (!subject || !subject.trim()) {
      res.status(400).json({ error: "Subject is required." }); return;
    }
    if (!examDate) {
      res.status(400).json({ error: "Exam date is required." }); return;
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: "Priority must be red, orange, yellow, or green." }); return;
    }

    const result = await query(
      "INSERT INTO exams (user_id, subject, exam_date, priority) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, subject.trim(), examDate, priority],
    );

    res.json({ ok: true, id: result.rows[0].id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/exams/:id — update an exam ────────────────────── */
router.patch("/exams/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const examId = Number(req.params.id);
    const { subject, examDate, priority } = req.body as {
      subject?: string; examDate?: string; priority?: string;
    };

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: "Priority must be red, orange, yellow, or green." }); return;
    }

    const existing = (await query("SELECT id FROM exams WHERE id = $1 AND user_id = $2", [examId, userId])).rows[0];
    if (!existing) { res.status(404).json({ error: "Exam not found." }); return; }

    if (subject !== undefined) {
      await query("UPDATE exams SET subject = $1 WHERE id = $2 AND user_id = $3", [subject.trim(), examId, userId]);
    }
    if (examDate !== undefined) {
      await query("UPDATE exams SET exam_date = $1 WHERE id = $2 AND user_id = $3", [examDate, examId, userId]);
    }
    if (priority !== undefined) {
      await query("UPDATE exams SET priority = $1 WHERE id = $2 AND user_id = $3", [priority, examId, userId]);
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/exams/:id — delete an exam ───────────────────── */
router.delete("/exams/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const examId = Number(req.params.id);

    const result = await query(
      "DELETE FROM exams WHERE id = $1 AND user_id = $2",
      [examId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Exam not found." }); return;
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/exams/:id/papers — add a paper to an exam ─────── */
router.post("/exams/:id/papers", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const examId = Number(req.params.id);
    const { name, pathwayId, topicIds } = req.body as {
      name: string; pathwayId?: number | null; topicIds?: string[];
    };

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Paper name is required." }); return;
    }

    const exam = (await query("SELECT id FROM exams WHERE id = $1 AND user_id = $2", [examId, userId])).rows[0];
    if (!exam) { res.status(404).json({ error: "Exam not found." }); return; }

    const result = await query(
      "INSERT INTO exam_papers (exam_id, user_id, name, pathway_id, topic_ids) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [examId, userId, name.trim(), pathwayId ?? null, JSON.stringify(topicIds ?? [])],
    );

    res.json({ ok: true, id: result.rows[0].id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── PATCH /api/exams/:id/papers/:paperId — update paper topics ─ */
router.patch("/exams/:id/papers/:paperId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const paperId = Number(req.params.paperId);
    const { pathwayId, topicIds } = req.body as {
      pathwayId?: number | null; topicIds?: string[];
    };

    const existing = (await query(
      "SELECT id FROM exam_papers WHERE id = $1 AND user_id = $2",
      [paperId, userId],
    )).rows[0];
    if (!existing) { res.status(404).json({ error: "Paper not found." }); return; }

    await query(
      "UPDATE exam_papers SET pathway_id = $1, topic_ids = $2 WHERE id = $3 AND user_id = $4",
      [pathwayId ?? null, JSON.stringify(topicIds ?? []), paperId, userId],
    );

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── DELETE /api/exams/:id/papers/:paperId ───────────────────── */
router.delete("/exams/:id/papers/:paperId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as AuthUser;
    const paperId = Number(req.params.paperId);

    const result = await query(
      "DELETE FROM exam_papers WHERE id = $1 AND user_id = $2",
      [paperId, userId],
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: "Paper not found." }); return;
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
