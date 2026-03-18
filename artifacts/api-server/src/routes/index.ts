import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import aiRouter from "./ai.js";
import authRouter from "./auth.js";
import pathwaysRouter from "./pathways.js";
import calendarRouter from "./calendar.js";
import quizResultsRouter from "./quizResults.js";
import leaderboardRouter from "./leaderboard.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(authRouter);
router.use(pathwaysRouter);
router.use(calendarRouter);
router.use(quizResultsRouter);
router.use(leaderboardRouter);
router.use(adminRouter);

export default router;
