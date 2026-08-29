import { useEffect, useRef } from "react";

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "😊", "😉", "😎", "🤩",
  "😢", "😭", "😡", "🥺", "😴", "🤔", "😅", "🙄",
  "👍", "👎", "🙌", "👏", "🙏", "💪", "🤝", "✌️",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🔥",
  "✨", "🎉", "🎂", "🌸", "🌟", "😮", "😱", "🤗",
];

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 bg-white border border-neutral-100 shadow-popover rounded-2xl p-3 grid grid-cols-8 gap-1 w-72 z-20 animate-fade-in"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="text-xl hover:bg-neutral-100 rounded-lg py-1 transition"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
