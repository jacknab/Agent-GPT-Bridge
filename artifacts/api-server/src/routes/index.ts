import { Router, type IRouter } from "express";
import healthRouter from "./health";
import callsRouter from "./calls";
import configRouter from "./config";
import twilioRouter from "./twilio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(callsRouter);
router.use(configRouter);
router.use(twilioRouter);

export default router;
