import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createStory,
  storyFeed,
  viewStory,
  toggleStoryLike,
  deleteStory,
  replyToStory,
} from "../controllers/storyController.js";

const router = Router();

router.use(auth);

router.get("/feed", storyFeed);
router.post("/", upload.single("media"), createStory);
router.post("/:id/view", viewStory);
router.post("/:id/like", toggleStoryLike);
router.post("/:id/reply", replyToStory);
router.delete("/:id", deleteStory);

export default router;
