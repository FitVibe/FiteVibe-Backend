import { Router } from "express";

const router = Router();

// each route has its folder and folder has index.ts 
// each route contain one controller and each controller direct to service
// each controller contains some validators for its requests
// each service calls database and send queries  
router.use("/", /*Router name */);

export default router;