import { Router } from "express";
import authRouter from "./authRouter";
import profileRouter from "./profileRouter";
import homeRouter from "./homeRouter";
import settingsRouter from "./settingsRouter";
import challengeRouter from "./challengeRouter";
import notificationRouter from "./notificationRouter";

const router = Router();

router.get("/", (req, res) => {
    res.json({ message: "FitVibe API is running", status: "ok" });
});

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/home", homeRouter);
router.use("/settings", settingsRouter);
router.use("/challenges", challengeRouter);
router.use("/notifications", notificationRouter);

export default router;