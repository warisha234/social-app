import { useState } from "react";
import { RotateCw } from "lucide-react";
import api from "../../api/api";

const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceGame() {
  const [dice, setDice] = useState(1);
  const [score, setScore] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState("Roll the dice!");

  const rollDice = async () => {
    if (rolling) return;

    setRolling(true);
    setMessage("Rolling...");

    setTimeout(async () => {
      const result = Math.floor(Math.random() * 6) + 1;

      setDice(result);

      const newScore = score + result;
      setScore(newScore);

      setMessage(`You rolled ${result}!`);

      setRolling(false);

      try {
        await api.post("/games/score", {
          game: "dice",
          score: newScore,
        });
      } catch (error) {
        console.error("Could not save game score:", error);
      }
    }, 600);
  };

  const resetGame = () => {
    setDice(1);
    setScore(0);
    setMessage("Roll the dice!");
  };

  return (
    <div className="bg-panel border border-line rounded-3xl p-6 text-center">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-body">
          🎲 Dice Roll
        </h1>

        <p className="text-sm text-faint mt-1">
          Roll the dice and build your score.
        </p>
      </div>

      <div
        className={`text-8xl mb-6 transition-transform ${
          rolling ? "rotate-180 scale-110" : ""
        }`}
      >
        {diceFaces[dice - 1]}
      </div>

      <p className="text-faint text-sm mb-1">Your Score</p>

      <p className="text-4xl font-display font-bold text-brand-pink mb-3">
        {score}
      </p>

      <p className="text-sm text-faint mb-6">{message}</p>

      <div className="flex justify-center gap-3">
        <button
          onClick={rollDice}
          disabled={rolling}
          className="flex items-center gap-2 px-6 py-3 rounded-full btn-gradient text-white font-semibold disabled:opacity-50"
        >
          <RotateCw size={17} />
          {rolling ? "Rolling..." : "Roll Dice"}
        </button>

        <button
          onClick={resetGame}
          className="px-5 py-3 rounded-full border border-line text-body font-semibold hover:bg-soft"
        >
          Reset
        </button>
      </div>
    </div>
  );
}