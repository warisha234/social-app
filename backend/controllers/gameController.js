import GameScore from "../models/GameScore.js";

export async function saveGameScore(req, res) {
  try {
    const { game, score, result } = req.body;

    if (!game) {
      return res.status(400).json({
        message: "Game is required",
      });
    }

    const allowedGames = ["dice", "tictactoe", "rps"];

    if (!allowedGames.includes(game)) {
      return res.status(400).json({
        message: "Invalid game",
      });
    }

    const gameScore = await GameScore.create({
      user: req.user._id,
      game,
      score: Number(score) || 0,
      result: result || "score",
    });

    res.status(201).json({
      message: "Game score saved",
      gameScore,
    });
  } catch (error) {
    console.error("Save game score error:", error);

    res.status(500).json({
      message: "Could not save game score",
    });
  }
}