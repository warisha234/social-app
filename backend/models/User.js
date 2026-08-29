import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 250 },
    note: { type: String, default: "", maxlength: 60 },
    isPrivate: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    clearedConversations: [
      {
        with: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        clearedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function (viewerId) {
  return {
    _id: this._id,
    fullName: this.fullName,
    username: this.username,
    avatar: this.avatar,
    bio: this.bio,
    note: this.note,
    isPrivate: this.isPrivate,
    followerCount: this.followers.length,
    followingCount: this.following.length,
    isFollowing: viewerId
      ? this.followers.some((f) => f.toString() === viewerId.toString())
      : false,
  };
};

export default mongoose.model("User", userSchema);
