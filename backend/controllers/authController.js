import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

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

export async function signup(req, res) {
  const { fullName, username, email, password } = req.body;
  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (existing) {
    return res.status(409).json({ message: "Username or email already in use" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashed,
  });

  const token = signToken(user._id);
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: "Username/email and password are required" });
  }

  const user = await User.findOne({
    $or: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }],
  });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  if (!user.isActive) return res.status(403).json({ message: "This account is deactivated" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id);
  res.json({ token, user: publicUser(user) });
}
