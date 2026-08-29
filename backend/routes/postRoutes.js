import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createPost,
  feed,
  explore,
  deletePost,
  toggleLike,
  toggleSave,
  toggleRepost,
  listComments,
  addComment,
  toggleCommentLike,
  editComment,
  deleteComment,
} from "../controllers/postController.js";
// import {
//   createPost,
//   feed,
//   explore,
//   deletePost,
//   toggleLike,
//   toggleSave,
//   toggleRepost,
//   listComments,
//   addComment,
// } from "../controllers/postController.js";

const router = Router();

router.use(auth);

router.get("/feed", feed);
router.get("/explore", explore);
router.post("/", upload.single("media"), createPost);
router.delete("/:id", deletePost);

router.post("/:id/like", toggleLike);
router.post("/:id/save", toggleSave);
router.post("/:id/repost", toggleRepost);

router.get("/:id/comments", listComments);
router.post("/:id/comments", addComment);

router.post("/comments/:commentId/like", toggleCommentLike);
router.patch("/comments/:commentId", editComment);
router.delete("/comments/:commentId", deleteComment);

export default router;
