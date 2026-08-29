import mongoose from "mongoose";

const gameScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    game: {
      type: String,
      enum: ["dice", "tictactoe", "rps"],
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    result: {
      type: String,
      enum: ["win", "loss", "draw", "score"],
      default: "score",
    },
  },
  { timestamps: true }
);

export default mongoose.model("GameScore", gameScoreSchema);