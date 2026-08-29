import { Router } from "express";
import auth from "../middleware/auth.js";
import { listNotifications } from "../controllers/notificationController.js";

const router = Router();

router.use(auth);
router.get("/", listNotifications);

export default router;
