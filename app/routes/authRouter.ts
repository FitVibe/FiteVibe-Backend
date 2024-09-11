import { Router } from "express";
import { authController } from "../controllers";

const router = Router()

router.post("/sign_in", authController.signup)

export default router;