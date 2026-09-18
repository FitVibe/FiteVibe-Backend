import { Router } from "express";
import authRouter from "./authRouter";
import homeRouter from "./homeRouter";
import settingsRouter from "./settingsRouter";
import challengeRouter from "./challengeRouter";

const router = Router();

router.get("/", (req, res) => {
    res.json({ message: "FitVibe API is running", status: "ok" });
});

router.use("/auth", authRouter);
router.use("/home", homeRouter);
router.use("/settings", settingsRouter);
router.use("/challenges", challengeRouter);

export default router;