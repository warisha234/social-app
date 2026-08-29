import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

function decoratePost(post, viewer) {
  return {
    _id: post._id,
    author: post.author,
    caption: post.caption,
    location: post.location,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    likeCount: post.likes.length,
    repostCount: post.reposts.length,
    commentCount: post.commentCount,
    likedByMe: post.likes.some((id) => id.toString() === viewer._id.toString()),
    repostedByMe: post.reposts.some((id) => id.toString() === viewer._id.toString()),
    savedByMe: viewer.savedPosts.some((id) => id.toString() === post._id.toString()),
    createdAt: post.createdAt,
  };
}

export async function createPost(req, res) {
  if (!req.file) return res.status(400).json({ message: "Media file is required" });
  const { caption, location } = req.body;
  const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

  const post = await Post.create({
    author: req.user._id,
    caption: caption || "",
    location: location || "",
    mediaUrl: req.file.path,
    mediaType,
  });
  await post.populate("author", "username avatar");
  res.status(201).json(decoratePost(post, req.user));
}

export async function feed(req, res) {
  const sort = req.query.sort === "popular" ? { likesCount: -1 } : { createdAt: -1 };
  const followingIds = [...req.user.following, req.user._id];

  let posts = await Post.find({ author: { $in: followingIds } })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });

  if (req.query.sort === "popular") {
    posts = posts.sort((a, b) => b.likes.length - a.likes.length);
  }

  res.json(posts.map((p) => decoratePost(p, req.user)));
}

export async function explore(req, res) {
  const posts = await Post.find({ author: { $ne: req.user._id } })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(posts.map((p) => decoratePost(p, req.user)));
}

export async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only delete your own posts" });
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ message: "Post deleted" });
}

export async function toggleLike(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const already = post.likes.some((id) => id.toString() === req.user._id.toString());
  if (already) {
    post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    post.likes.push(req.user._id);
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        actor: req.user._id,
        type: "like",
        text: "liked your post",
        post: post._id,
      });
    }
  }
  await post.save();
  res.json({ liked: !already, likeCount: post.likes.length });
}

export async function toggleSave(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const user = req.user;
  const already = user.savedPosts.some((id) => id.toString() === post._id.toString());
  if (already) {
    user.savedPosts = user.savedPosts.filter((id) => id.toString() !== post._id.toString());
  } else {
    user.savedPosts.push(post._id);
  }
  await user.save();
  res.json({ saved: !already });
}

export async function toggleRepost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const already = post.reposts.some((id) => id.toString() === req.user._id.toString());
  if (already) {
    post.reposts = post.reposts.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    post.reposts.push(req.user._id);
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        actor: req.user._id,
        type: "repost",
        text: "reposted your post",
        post: post._id,
      });
    }
  }
  await post.save();
  res.json({ reposted: !already, repostCount: post.reposts.length });
}
function decorateComment(comment, viewer) {
  return {
    _id: comment._id,
    post: comment.post,
    author: comment.author,
    text: comment.text,
    likes: comment.likes || [],
    likeCount: comment.likes?.length || 0,
    likedByMe: (comment.likes || []).some(
      (id) => id.toString() === viewer._id.toString()
    ),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export async function listComments(req, res) {
  const comments = await Comment.find({ post: req.params.id })
    .sort({ createdAt: 1 })
    .populate("author", "username avatar");

  res.json(comments.map((comment) => decorateComment(comment, req.user)));
}

export async function addComment(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      message: "Comment can't be empty",
    });
  }

  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    text: text.trim(),
  });

  post.commentCount += 1;
  await post.save();

  await comment.populate("author", "username avatar");

  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      actor: req.user._id,
      type: "comment",
      text: "commented on your post",
      post: post._id,
    });
  }

  res.status(201).json(decorateComment(comment, req.user));
}

export async function toggleCommentLike(req, res) {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      message: "Comment not found",
    });
  }

  const alreadyLiked = comment.likes.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (alreadyLiked) {
    comment.likes = comment.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    comment.likes.push(req.user._id);
  }

  await comment.save();

  res.json({
    liked: !alreadyLiked,
    likeCount: comment.likes.length,
  });
}

export async function editComment(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      message: "Comment can't be empty",
    });
  }

  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      message: "Comment not found",
    });
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "You can only edit your own comments",
    });
  }

  comment.text = text.trim();

  await comment.save();

  await comment.populate("author", "username avatar");

  res.json(decorateComment(comment, req.user));
}

export async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      message: "Comment not found",
    });
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: "You can only delete your own comments",
    });
  }

  const post = await Post.findById(comment.post);

  await comment.deleteOne();

  if (post) {
    post.commentCount = Math.max(0, post.commentCount - 1);
    await post.save();
  }

  res.json({
    message: "Comment deleted",
    commentId: req.params.commentId,
  });
}
// export async function listComments(req, res) {
//   const comments = await Comment.find({ post: req.params.id })
//     .sort({ createdAt: 1 })
//     .populate("author", "username avatar");
//   res.json(comments);
// }

// export async function addComment(req, res) {
//   const { text } = req.body;
//   if (!text || !text.trim()) return res.status(400).json({ message: "Comment can't be empty" });

//   const post = await Post.findById(req.params.id);
//   if (!post) return res.status(404).json({ message: "Post not found" });

//   const comment = await Comment.create({
//     post: post._id,
//     author: req.user._id,
//     text: text.trim(),
//   });
//   post.commentCount += 1;
//   await post.save();
//   await comment.populate("author", "username avatar");

//   if (post.author.toString() !== req.user._id.toString()) {
//     await Notification.create({
//       recipient: post.author,
//       actor: req.user._id,
//       type: "comment",
//       text: "commented on your post",
//       post: post._id,
//     });
//   }

//   res.status(201).json(comment);
// }
