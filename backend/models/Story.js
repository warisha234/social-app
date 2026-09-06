import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ["image", "video"], required: true },
    caption: { type: String, default: "", maxlength: 200 },
    musicUrl: { type: String, default: "" },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Story", storySchema);
