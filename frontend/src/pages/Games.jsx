import { useState } from "react";
import { Gamepad2, ArrowLeft } from "lucide-react";
import GameCard from "../components/games/GameCard";
import DiceGame from "../components/games/DiceGame";
import TicTacToe from "../components/games/TicTacToe";
import RockPaperScissors from "../components/games/RockPaperScissors";

const games = [
  {
    id: "dice",
    title: "Dice Roll",
    description: "Roll the dice and try to beat your best score.",
    emoji: "🎲",
  },
  {
    id: "tictactoe",
    title: "Tic Tac Toe",
    description: "Challenge the computer and get three in a row.",
    emoji: "❌⭕",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    description: "Choose your move and beat the computer.",
    emoji: "✊",
  },
];

export default function Games() {
  const [selectedGame, setSelectedGame] = useState(null);

  const goBack = () => setSelectedGame(null);

  if (selectedGame === "dice") {
    return (
      <div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-faint hover:text-body mb-5"
        >
          <ArrowLeft size={18} />
          Back to Games
        </button>

        <DiceGame />
      </div>
    );
  }

  if (selectedGame === "tictactoe") {
    return (
      <div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-faint hover:text-body mb-5"
        >
          <ArrowLeft size={18} />
          Back to Games
        </button>

        <TicTacToe />
      </div>
    );
  }

  if (selectedGame === "rps") {
    return (
      <div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-faint hover:text-body mb-5"
        >
          <ArrowLeft size={18} />
          Back to Games
        </button>

        <RockPaperScissors />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl btn-gradient flex items-center justify-center text-white">
            <Gamepad2 size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-display font-bold text-body">
              Games
            </h1>
            <p className="text-sm text-faint">
              Take a break and have some fun.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => setSelectedGame(game.id)}
          />
        ))}
      </div>
    </div>
  );
}