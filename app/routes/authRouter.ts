import { Router } from "express";
import { authController } from "../controllers";

const router = Router()

router.post("/sign_up", authController.signup)
router.post("/sign_in", authController.signin)

export default router;