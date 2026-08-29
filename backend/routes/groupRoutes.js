import { Router } from "express";

import auth from "../middleware/auth.js";

import {
  createGroup,
  getMyGroups,
} from "../controllers/groupController.js";

const router = Router();

router.use(auth);

router.get("/", getMyGroups);

router.post("/", createGroup);

export default router;