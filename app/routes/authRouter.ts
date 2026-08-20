import { Router } from "express";
import { authController } from "../controllers";
import { isAuthenticated } from "../middlewares/authMiddleware";

const router = Router()

router.post("/sign_up", authController.signup)
router.post("/sign_in", authController.signin)
router.post("/sign_out", authController.logout)
router.get("/current_user", isAuthenticated, authController.currentUser)

export default router;