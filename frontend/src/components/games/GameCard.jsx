import { Play } from "lucide-react";

export default function GameCard({ game, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-panel border border-line rounded-2xl p-5 hover:shadow-card transition group"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-soft flex items-center justify-center text-3xl shrink-0">
          {game.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-lg text-body">
            {game.title}
          </h2>

          <p className="text-sm text-faint mt-1">
            {game.description}
          </p>
        </div>

        <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
          <Play size={17} fill="currentColor" />
        </div>
      </div>
    </button>
  );
}