import { useState } from "react";
import api from "../../api/api";

const choices = [
  { id: "rock", label: "Rock", emoji: "✊" },
  { id: "paper", label: "Paper", emoji: "✋" },
  { id: "scissors", label: "Scissors", emoji: "✌️" },
];

function getResult(player, computer) {
  if (player === computer) return "draw";

  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return "win";
  }

  return "loss";
}

export default function RockPaperScissors() {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);

  const play = async (player) => {
    const computer =
      choices[Math.floor(Math.random() * choices.length)].id;

    const gameResult = getResult(player, computer);

    setPlayerChoice(player);
    setComputerChoice(computer);
    setResult(gameResult);

    if (gameResult === "win") {
      setWins((value) => value + 1);
    }

    if (gameResult === "loss") {
      setLosses((value) => value + 1);
    }

    if (gameResult === "draw") {
      setDraws((value) => value + 1);
    }

    try {
      await api.post("/games/score", {
        game: "rps",
        result: gameResult,
        score: gameResult === "win" ? wins + 1 : wins,
      });
    } catch (error) {
      console.error("Could not save game score:", error);
    }
  };

  const reset = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const findChoice = (id) => choices.find((item) => item.id === id);

  return (
    <div className="bg-panel border border-line rounded-3xl p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-body">
        ✊✋✌️ Rock Paper Scissors
      </h1>

      <p className="text-sm text-faint mt-1 mb-6">
        Choose your move.
      </p>

      <div className="flex justify-center gap-6 mb-6 text-sm">
        <span>You: <b>{wins}</b></span>
        <span>Losses: <b>{losses}</b></span>
        <span>Draws: <b>{draws}</b></span>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => play(choice.id)}
            className="w-24 h-24 rounded-2xl bg-soft border border-line hover:bg-pink-50 dark:hover:bg-brand-pink/10 transition"
          >
            <div className="text-3xl">{choice.emoji}</div>
            <div className="text-xs font-semibold text-body mt-1">
              {choice.label}
            </div>
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-7">
          <div className="flex justify-center items-center gap-8">
            <div>
              <div className="text-4xl">
                {findChoice(playerChoice)?.emoji}
              </div>
              <p className="text-xs text-faint mt-1">You</p>
            </div>

            <span className="font-bold text-faint">VS</span>

            <div>
              <div className="text-4xl">
                {findChoice(computerChoice)?.emoji}
              </div>
              <p className="text-xs text-faint mt-1">Computer</p>
            </div>
          </div>

          <p className="text-lg font-bold text-body mt-5">
            {result === "win"
              ? "🎉 You won!"
              : result === "loss"
              ? "Computer won!"
              : "It's a draw!"}
          </p>

          <button
            onClick={reset}
            className="mt-4 px-6 py-2.5 rounded-full btn-gradient text-white font-semibold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}