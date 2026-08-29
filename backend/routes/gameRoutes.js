import express from "express";
import auth from "../middleware/auth.js";
import { saveGameScore } from "../controllers/gameController.js";

const router = express.Router();

router.post("/score", auth, saveGameScore);

export default router;