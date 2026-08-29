import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";


// =====================================================
// DECORATE MESSAGE
// =====================================================

function decorate(m) {
  return {
    _id: m._id,

    sender: m.sender,
    recipient: m.recipient || null,
    group: m.group || null,

    text: m.unsent ? "" : m.text,

    mediaUrl: m.unsent ? null : m.mediaUrl,
    mediaType: m.unsent ? null : m.mediaType,

    storyReply:
      !m.unsent && m.storyReply?.storyId
        ? m.storyReply
        : null,

    editedAt: m.editedAt,

    unsent: m.unsent,

    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}


// =====================================================
// DIRECT CONVERSATIONS
// =====================================================

export async function listConversations(req, res) {
  try {
    const myId = req.user._id;

    const messages = await Message.find({
      group: null,

      $or: [
        { sender: myId },
        { recipient: myId },
      ],

      deletedFor: {
        $ne: myId,
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const clearedMap = new Map(
      (req.user.clearedConversations || []).map(
        (c) => [
          c.with.toString(),
          c.clearedAt,
        ]
      )
    );

    const seen = new Map();

    for (const m of messages) {
      const otherId =
        m.sender.toString() === myId.toString()
          ? m.recipient?.toString()
          : m.sender?.toString();

      if (!otherId) continue;

      const clearedAt =
        clearedMap.get(otherId);

      if (
        clearedAt &&
        new Date(m.createdAt) <=
          new Date(clearedAt)
      ) {
        continue;
      }

      if (!seen.has(otherId)) {
        let preview = "";

        if (m.unsent) {
          preview = "Message unsent";
        } else if (
          m.storyReply?.storyId
        ) {
          preview = "Replied to a story";
        } else if (m.mediaUrl) {
          preview = "Sent an attachment";
        } else {
          preview = m.text || "";
        }

        seen.set(otherId, preview);
      }
    }

    const ids = [...seen.keys()];

    if (ids.length === 0) {
      return res.json([]);
    }

    const otherUsers =
      await User.find({
        _id: {
          $in: ids,
        },
      }).select(
        "username avatar fullName"
      );

    const conversations =
      otherUsers.map((u) => ({
        otherUser: u,
        lastMessage:
          seen.get(
            u._id.toString()
          ) || "",
      }));

    return res.json(conversations);
  } catch (error) {
    console.error(
      "List conversations error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load conversations",
    });
  }
}


// =====================================================
// DIRECT THREAD
// =====================================================

export async function getThread(req, res) {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;

    const clearedEntry =
      (req.user.clearedConversations || []).find(
        (c) =>
          c.with.toString() ===
          otherId.toString()
      );

    const query = {
      group: null,

      $or: [
        {
          sender: myId,
          recipient: otherId,
        },
        {
          sender: otherId,
          recipient: myId,
        },
      ],

      deletedFor: {
        $ne: myId,
      },
    };

    if (clearedEntry) {
      query.createdAt = {
        $gt: clearedEntry.clearedAt,
      };
    }

    const messages =
      await Message.find(query)
        .populate(
          "sender",
          "username avatar fullName"
        )
        .sort({
          createdAt: 1,
        });

    await Message.updateMany(
      {
        group: null,
        sender: otherId,
        recipient: myId,
        readAt: null,
      },
      {
        readAt: new Date(),
      }
    );

    return res.json(
      messages.map(decorate)
    );
  } catch (error) {
    console.error(
      "Get thread error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load messages",
    });
  }
}


// =====================================================
// SEND DIRECT MESSAGE
// =====================================================

export async function sendMessage(req, res) {
  try {
    const { text } = req.body;

    const hasText =
      text && text.trim();

    const hasMedia = !!req.file;

    if (!hasText && !hasMedia) {
      return res.status(400).json({
        message:
          "Message can't be empty",
      });
    }

    const message =
      await Message.create({
        sender: req.user._id,

        recipient:
          req.params.userId,

        group: null,

        text: hasText
          ? text.trim()
          : "",

       mediaUrl: hasMedia
  ? req.file.path
  : null,

        mediaType: hasMedia
          ? req.file.mimetype.startsWith(
              "video"
            )
            ? "video"
            : req.file.mimetype.startsWith(
                "audio"
              )
            ? "audio"
            : "image"
          : null,
      });

    await message.populate(
      "sender",
      "username avatar fullName"
    );

    return res.status(201).json(
      decorate(message)
    );
  } catch (error) {
    console.error(
      "Send direct message error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to send message",
    });
  }
}


// =====================================================
// GROUP THREAD
// =====================================================

export async function getGroupThread(
  req,
  res
) {
  try {
    const myId = req.user._id;
    const groupId = req.params.groupId;

    const group =
      await Group.findOne({
        _id: groupId,
        members: myId,
      });

    if (!group) {
      return res.status(403).json({
        message:
          "You are not a member of this group",
      });
    }

    const messages =
      await Message.find({
        group: groupId,

        deletedFor: {
          $ne: myId,
        },
      })
        .populate(
          "sender",
          "username avatar fullName"
        )
        .sort({
          createdAt: 1,
        });

    return res.json(
      messages.map(decorate)
    );
  } catch (error) {
    console.error(
      "Get group messages error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load group messages",
    });
  }
}


// =====================================================
// SEND GROUP MESSAGE
// =====================================================

export async function sendGroupMessage(
  req,
  res
) {
  try {
    const { text } = req.body;
    const groupId = req.params.groupId;

    const hasText =
      text && text.trim();

    const hasMedia = !!req.file;

    if (!hasText && !hasMedia) {
      return res.status(400).json({
        message:
          "Message can't be empty",
      });
    }

    // IMPORTANT:
    // User MUST actually belong to this group.
    const group =
      await Group.findOne({
        _id: groupId,
        members: req.user._id,
      });

    if (!group) {
      return res.status(403).json({
        message:
          "You are not a member of this group",
      });
    }

    const message =
      await Message.create({
        sender: req.user._id,

        // Group message has NO recipient.
        recipient: null,

        group: groupId,

        text: hasText
          ? text.trim()
          : "",

        mediaUrl: hasMedia
          ? `/uploads/${req.file.filename}`
          : null,

        mediaType: hasMedia
          ? req.file.mimetype.startsWith(
              "video"
            )
            ? "video"
            : req.file.mimetype.startsWith(
                "audio"
              )
            ? "audio"
            : "image"
          : null,
      });

    await message.populate(
      "sender",
      "username avatar fullName"
    );

    // Touch group updatedAt so newest groups
    // stay near the top.
    group.updatedAt = new Date();
    await group.save();

    return res.status(201).json(
      decorate(message)
    );
  } catch (error) {
    console.error(
      "Send group message error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to send group message",
    });
  }
}


// =====================================================
// EDIT MESSAGE
// =====================================================

export async function editMessage(
  req,
  res
) {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message:
          "Message text can't be empty",
      });
    }

    const message =
      await Message.findById(
        req.params.messageId
      );

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found",
      });
    }

    if (
      message.sender.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You can only edit your own messages",
      });
    }

    if (message.unsent) {
      return res.status(400).json({
        message:
          "Can't edit an unsent message",
      });
    }

    if (message.mediaUrl) {
      return res.status(400).json({
        message:
          "Can't edit an attachment",
      });
    }

    message.text =
      text.trim();

    message.editedAt =
      new Date();

    await message.save();

    await message.populate(
      "sender",
      "username avatar fullName"
    );

    return res.json(
      decorate(message)
    );
  } catch (error) {
    console.error(
      "Edit message error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to edit message",
    });
  }
}


// =====================================================
// DELETE / UNSEND MESSAGE
// =====================================================

export async function deleteMessage(
  req,
  res
) {
  try {
    const scope =
      req.query.scope ===
      "everyone"
        ? "everyone"
        : "me";

    const message =
      await Message.findById(
        req.params.messageId
      );

    if (!message) {
      return res.status(404).json({
        message:
          "Message not found",
      });
    }

    const isSender =
      message.sender.toString() ===
      req.user._id.toString();

    if (scope === "everyone") {
      if (!isSender) {
        return res.status(403).json({
          message:
            "You can only unsend your own messages",
        });
      }

      message.unsent = true;
      message.text = "";
      message.mediaUrl = null;
      message.mediaType = null;

      await message.save();

      await message.populate(
        "sender",
        "username avatar fullName"
      );

      return res.json(
        decorate(message)
      );
    }

    if (
      !message.deletedFor.some(
        (id) =>
          id.toString() ===
          req.user._id.toString()
      )
    ) {
      message.deletedFor.push(
        req.user._id
      );

      await message.save();
    }

    return res.json({
      message:
        "Deleted for you",
    });
  } catch (error) {
    console.error(
      "Delete message error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete message",
    });
  }
}


// =====================================================
// CLEAR DIRECT CONVERSATION
// =====================================================

export async function clearConversation(
  req,
  res
) {
  try {
    const otherId =
      req.params.userId;

    const user = req.user;

    const existing =
      (user.clearedConversations || []).find(
        (c) =>
          c.with.toString() ===
          otherId.toString()
      );

    if (existing) {
      existing.clearedAt =
        new Date();
    } else {
      user.clearedConversations.push({
        with: otherId,
        clearedAt: new Date(),
      });
    }

    await user.save();

    return res.json({
      message:
        "Conversation cleared",
    });
  } catch (error) {
    console.error(
      "Clear conversation error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to clear conversation",
    });
  }
}