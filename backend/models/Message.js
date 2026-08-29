import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Direct message ke liye required.
    // Group message me null hoga.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Group message ke liye.
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    text: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    mediaUrl: {
      type: String,
      default: null,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "audio", null],
      default: null,
    },

    storyReply: {
      storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
        default: null,
      },

      mediaUrl: {
        type: String,
        default: null,
      },

      mediaType: {
        type: String,
        enum: ["image", "video", null],
        default: null,
      },
    },

    editedAt: {
      type: Date,
      default: null,
    },

    unsent: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);