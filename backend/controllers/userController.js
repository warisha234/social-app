import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";

function publicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    note: user.note,
    isPrivate: user.isPrivate,
    followerCount: user.followers.length,
    followingCount: user.following.length,
  };
}

export async function getMe(req, res) {
  res.json(publicUser(req.user));
}

export async function updateMe(req, res) {
  const { fullName, bio, note, isPrivate } = req.body;
  const user = req.user;
  if (fullName !== undefined) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (note !== undefined) user.note = note;
  if (isPrivate !== undefined) user.isPrivate = isPrivate === "true" || isPrivate === true;
  if (req.file) user.avatar = `/uploads/${req.file.filename}`;
  await user.save();
  res.json(publicUser(user));
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const match = await bcrypt.compare(currentPassword, req.user.password);
  if (!match) return res.status(400).json({ message: "Current password is incorrect" });
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }
  req.user.password = await bcrypt.hash(newPassword, 10);
  await req.user.save();
  res.json({ message: "Password updated" });
}

export async function deactivateMe(req, res) {
  req.user.isActive = false;
  await req.user.save();
  res.json({ message: "Account deactivated" });
}

export async function deleteMe(req, res) {
  const { password } = req.body;
  const match = await bcrypt.compare(password || "", req.user.password);
  if (!match) return res.status(400).json({ message: "Password is incorrect" });

  await Post.deleteMany({ author: req.user._id });
  await User.updateMany(
    {},
    { $pull: { followers: req.user._id, following: req.user._id, savedPosts: { $in: [] } } }
  );
  await req.user.deleteOne();
  res.json({ message: "Account deleted" });
}

export async function getProfile(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) return res.status(404).json({ message: "User not found" });
  const postCount = await Post.countDocuments({ author: user._id });
  res.json({ ...publicUser(user), postCount, isFollowing: user.followers.some((f) => f.toString() === req.user._id.toString()) });
}

export async function searchUsers(req, res) {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const users = await User.find({
    isActive: true,
    $or: [
      { username: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
    ],
  })
    .limit(15)
    .select("username fullName avatar");
  res.json(users);
}

export async function suggestions(req, res) {
  const me = req.user;
  const users = await User.find({
    _id: { $ne: me._id, $nin: me.following },
    isActive: true,
  })
    .limit(6)
    .select("username fullName avatar");
  res.json(users);
}

export async function toggleFollow(req, res) {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  const already = req.user.following.some((f) => f.toString() === targetId);
  if (already) {
    req.user.following = req.user.following.filter((f) => f.toString() !== targetId);
    target.followers = target.followers.filter((f) => f.toString() !== req.user._id.toString());
  } else {
    req.user.following.push(targetId);
    target.followers.push(req.user._id);
    await Notification.create({
      recipient: target._id,
      actor: req.user._id,
      type: "follow",
      text: "started following you",
    });
  }
  await req.user.save();
  await target.save();
  res.json({ following: !already });
}

export async function userPosts(req, res) {
  const posts = await Post.find({ author: req.params.id })
    .sort({ createdAt: -1 })
    .populate("author", "username avatar");
  res.json(posts.map((p) => decoratePost(p, req.user)));
}

export async function userReposts(req, res) {
  const posts = await Post.find({ reposts: req.params.id })
    .sort({ createdAt: -1 })
    .populate("author", "username avatar");
  res.json(posts.map((p) => decoratePost(p, req.user)));
}

export async function userSaved(req, res) {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only view your own saved posts" });
  }
  const user = await User.findById(req.user._id).populate({
    path: "savedPosts",
    populate: { path: "author", select: "username avatar" },
  });
  res.json(
    [...user.savedPosts].reverse().map((p) => decoratePost(p, req.user))
  );
}

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
