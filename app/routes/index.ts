import { Router } from "express";
import authRouter from "./authRouter";
import homeRouter from "./homeRouter";
import settingsRouter from "./settingsRouter";

const router = Router();

router.use("/auth", authRouter);
router.use("/home", homeRouter);
router.use("/settings", settingsRouter);

export default router;