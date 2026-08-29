import { useState } from "react";
import api from "../../api/api";

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board) {
  for (const [a, b, c] of winningLines) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }

  if (board.every(Boolean)) return "draw";

  return null;
}

function getComputerMove(board) {
  const empty = board
    .map((value, index) => (value ? null : index))
    .filter((index) => index !== null);

  if (!empty.length) return null;

  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);
  const [playerWins, setPlayerWins] = useState(0);
  const [computerWins, setComputerWins] = useState(0);

  const play = (index) => {
    if (board[index] || winner) return;

    const playerBoard = [...board];
    playerBoard[index] = "X";

    const playerResult = getWinner(playerBoard);

    if (playerResult) {
      setBoard(playerBoard);
      setWinner(playerResult);

      if (playerResult === "X") {
        setPlayerWins((value) => value + 1);

        api.post("/games/score", {
          game: "tictactoe",
          result: "win",
          score: playerWins + 1,
        }).catch(console.error);
      }

      return;
    }

    const computerIndex = getComputerMove(playerBoard);

    if (computerIndex === null) {
      setBoard(playerBoard);
      setWinner("draw");
      return;
    }

    playerBoard[computerIndex] = "O";

    const computerResult = getWinner(playerBoard);

    setBoard(playerBoard);

    if (computerResult) {
      setWinner(computerResult);

      if (computerResult === "O") {
        setComputerWins((value) => value + 1);

        api.post("/games/score", {
          game: "tictactoe",
          result: "loss",
          score: computerWins + 1,
        }).catch(console.error);
      }
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
  };

  return (
    <div className="bg-panel border border-line rounded-3xl p-6 text-center">
      <h1 className="text-2xl font-display font-bold text-body">
        ❌⭕ Tic Tac Toe
      </h1>

      <p className="text-sm text-faint mt-1 mb-5">
        You are X. Computer is O.
      </p>

      <div className="flex justify-center gap-8 mb-5 text-sm">
        <span className="text-body">
          You: <b>{playerWins}</b>
        </span>

        <span className="text-body">
          Computer: <b>{computerWins}</b>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[300px] mx-auto">
        {board.map((value, index) => (
          <button
            key={index}
            onClick={() => play(index)}
            className="aspect-square rounded-xl bg-soft border border-line text-3xl font-bold text-body hover:bg-pink-50 dark:hover:bg-brand-pink/10 transition"
          >
            {value}
          </button>
        ))}
      </div>

      {winner && (
        <div className="mt-5">
          <p className="font-semibold text-body mb-3">
            {winner === "X"
              ? "🎉 You won!"
              : winner === "O"
              ? "Computer won!"
              : "It's a draw!"}
          </p>

          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-full btn-gradient text-white font-semibold"
          >
            Play Again
          </button>
        </div>
      )}

      {!winner && (
        <button
          onClick={reset}
          className="mt-5 px-5 py-2.5 rounded-full border border-line text-body font-semibold hover:bg-soft"
        >
          Reset
        </button>
      )}
    </div>
  );
}