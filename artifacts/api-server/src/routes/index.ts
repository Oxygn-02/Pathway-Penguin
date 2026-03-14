import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import aiRouter from "./ai.js";
import authRouter from "./auth.js";
import pathwaysRouter from "./pathways.js";
import calendarRouter from "./calendar.js";
import quizResultsRouter from "./quizResults.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(authRouter);
router.use(pathwaysRouter);
router.use(calendarRouter);
router.use(quizResultsRouter);

export default router;
