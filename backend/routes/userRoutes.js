import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  getMe,
  updateMe,
  changePassword,
  deactivateMe,
  deleteMe,
  getProfile,
  searchUsers,
  suggestions,
  toggleFollow,
  userPosts,
  userReposts,
  userSaved,
   getFollowers,
  getFollowing,
} from "../controllers/userController.js";

const router = Router();

router.use(auth);

router.get("/me", getMe);
router.put("/me", upload.single("avatar"), updateMe);
router.put("/me/password", changePassword);
router.post("/me/deactivate", deactivateMe);
router.post("/me/delete", deleteMe);

router.get("/search", searchUsers);
router.get("/suggestions", suggestions);

router.get("/:username", getProfile);
router.post("/:id/follow", toggleFollow);
router.get("/:id/posts", userPosts);
router.get("/:id/reposts", userReposts);
router.get("/:id/saved", userSaved);

router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;
