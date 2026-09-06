import Story from "../models/Story.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";

function decorate(story, viewerId) {
  const ownerId = story.user?._id || story.user;

  const isOwner =
    ownerId?.toString() === viewerId.toString();

  return {
    _id: story._id,
    user: story.user,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption || "",
    musicUrl: story.musicUrl || "",
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,

    viewed: story.viewers.some(
      (v) => (v._id || v).toString() === viewerId.toString()
    ),

    likeCount: story.likes.length,

    likedByMe: story.likes.some(
      (v) => (v._id || v).toString() === viewerId.toString()
    ),

    viewerCount: story.viewers.length,

    // Only story owner receives the actual viewer list
    viewers: isOwner
      ? story.viewers.map((v) => ({
          _id: v._id,
          username: v.username,
          avatar: v.avatar,
        }))
      : [],
  };
}

export async function createStory(req, res) {
  let mediaUrl;
  let mediaType;

  const mediaFile = req.files?.media?.[0];
  const musicFile = req.files?.music?.[0];

  if (mediaFile) {
    mediaUrl = mediaFile.path;
    mediaType = mediaFile.mimetype.startsWith("video")
      ? "video"
      : "image";
  } else if (req.body.postId) {
    const post = await Post.findById(req.body.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    mediaUrl = post.mediaUrl;
    mediaType = post.mediaType;
  } else {
    return res.status(400).json({
      message: "Media file or postId is required",
    });
  }

  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  const story = await Story.create({
    user: req.user._id,
    mediaUrl,
    mediaType,
    caption: req.body.caption || "",
    musicUrl: musicFile ? musicFile.path : "",
    expiresAt,
  });

  await story.populate("user", "username avatar");

  res.status(201).json(
    decorate(story, req.user._id)
  );
}

export async function storyFeed(req, res) {
  const followingIds = [
    ...req.user.following,
    req.user._id,
  ];

  const stories = await Story.find({
    user: { $in: followingIds },
  })
    .sort({ createdAt: -1 })
    .populate("user", "username avatar")
    .populate("viewers", "username avatar");

  res.json(
    stories.map((s) =>
      decorate(s, req.user._id)
    )
  );
}

export async function viewStory(req, res) {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
    });
  }

  const alreadyViewed = story.viewers.some(
    (v) => v.toString() === req.user._id.toString()
  );

  if (!alreadyViewed) {
    story.viewers.push(req.user._id);
    await story.save();
  }

  res.json({
    message: "Marked as viewed",
    viewerCount: story.viewers.length,
  });
}

export async function toggleStoryLike(req, res) {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
    });
  }

  const already = story.likes.some(
    (v) => v.toString() === req.user._id.toString()
  );

  if (already) {
    story.likes = story.likes.filter(
      (v) =>
        v.toString() !== req.user._id.toString()
    );
  } else {
    story.likes.push(req.user._id);

    if (
      story.user.toString() !==
      req.user._id.toString()
    ) {
      await Notification.create({
        recipient: story.user,
        actor: req.user._id,
        type: "like",
        text: "liked your story",
      });
    }
  }

  await story.save();

  res.json({
    liked: !already,
    likeCount: story.likes.length,
  });
}

export async function deleteStory(req, res) {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
    });
  }

  if (
    story.user.toString() !==
    req.user._id.toString()
  ) {
    return res.status(403).json({
      message: "You can only delete your own story",
    });
  }

  await story.deleteOne();

  res.json({
    message: "Story deleted",
  });
}

export async function replyToStory(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      message: "Reply can't be empty",
    });
  }

  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(404).json({
      message: "Story not found",
    });
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: story.user,
    text: text.trim(),
    storyReply: {
      storyId: story._id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
    },
  });

  res.status(201).json({
    _id: message._id,
    sender: message.sender,
    recipient: message.recipient,
    text: message.text,
    mediaUrl: null,
    mediaType: null,
    storyReply: message.storyReply,
    unsent: false,
    editedAt: null,
    createdAt: message.createdAt,
  });
}