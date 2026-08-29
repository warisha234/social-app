import { Router } from "express";

import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

import {
  listConversations,
  getThread,
  sendMessage,
  getGroupThread,
  sendGroupMessage,
  editMessage,
  deleteMessage,
  clearConversation,
} from "../controllers/messageController.js";

const router = Router();

router.use(auth);


// =====================================================
// DIRECT MESSAGES
// =====================================================

router.get(
  "/conversations",
  listConversations
);

router.get(
  "/:userId",
  getThread
);

router.post(
  "/:userId",
  upload.single("media"),
  sendMessage
);

router.delete(
  "/conversation/:userId",
  clearConversation
);


// =====================================================
// GROUP MESSAGES
// =====================================================

router.get(
  "/group/:groupId",
  getGroupThread
);

router.post(
  "/group/:groupId",
  upload.single("media"),
  sendGroupMessage
);


// =====================================================
// MESSAGE ACTIONS
// =====================================================

router.put(
  "/message/:messageId",
  editMessage
);

router.delete(
  "/message/:messageId",
  deleteMessage
);

export default router;