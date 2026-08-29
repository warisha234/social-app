import { useEffect, useRef } from "react";

export const THEMES = {
  classic: {
    label: "Classic",
    type: "color",
    bubble: "bg-brand-pink",
    bubbleText: "text-white",
    background: "bg-panel",
    swatch: "#E1306C",
  },

  ocean: {
    label: "Ocean",
    type: "color",
    bubble: "bg-sky-500",
    bubbleText: "text-white",
    background: "bg-sky-50",
    swatch: "#0EA5E9",
  },

  sunset: {
    label: "Sunset",
    type: "color",
    bubble: "bg-orange-500",
    bubbleText: "text-white",
    background: "bg-orange-50",
    swatch: "#F97316",
  },

  midnight: {
    label: "Midnight",
    type: "color",
    bubble: "bg-violet-600",
    bubbleText: "text-white",
    background: "bg-violet-50",
    swatch: "#7C3AED",
  },

  forest: {
    label: "Forest",
    type: "color",
    bubble: "bg-emerald-600",
    bubbleText: "text-white",
    background: "bg-emerald-50",
    swatch: "#059669",
  },

  mono: {
    label: "Mono",
    type: "color",
    bubble: "bg-ink",
    bubbleText: "text-white",
    background: "bg-neutral-50",
    swatch: "#0F0F10",
  },

  hearts: {
    label: "Hearts",
    type: "wallpaper",
    bubble: "bg-brand-pink",
    bubbleText: "text-white",
    background: "bg-pink-50",
    wallpaper: "/chat-wallpapers/hearts.jpg",
  },

  stars: {
    label: "Stars",
    type: "wallpaper",
    bubble: "bg-violet-600",
    bubbleText: "text-white",
    background: "bg-violet-50",
    wallpaper: "/chat-wallpapers/stars.jpg",
  },

  flowers: {
    label: "Flowers",
    type: "wallpaper",
    bubble: "bg-pink-500",
    bubbleText: "text-white",
    background: "bg-rose-50",
    wallpaper: "/chat-wallpapers/flowers.jpg",
  },

  clouds: {
    label: "Clouds",
    type: "wallpaper",
    bubble: "bg-sky-500",
    bubbleText: "text-white",
    background: "bg-sky-50",
    wallpaper: "/chat-wallpapers/clouds.jpg",
  },

  minimal: {
    label: "Minimal",
    type: "wallpaper",
    bubble: "bg-brand-pink",
    bubbleText: "text-white",
    background: "bg-neutral-50",
    wallpaper: "/chat-wallpapers/minimal.jpg",
  },
};

export default function ThemePicker({ current, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 bg-white border border-neutral-100 shadow-popover rounded-2xl p-3 w-60 z-30 animate-fade-in max-h-[70vh] overflow-y-auto"
    >
      <p className="text-xs font-semibold text-neutral-500 px-1 mb-3">
        Chat theme
      </p>

      {/* COLORS */}
      <p className="text-[11px] font-semibold text-neutral-400 px-1 mb-1.5">
        COLORS
      </p>

      <div className="flex flex-col gap-1 mb-4">
        {Object.entries(THEMES)
          .filter(([, theme]) => theme.type === "color")
          .map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-neutral-50 transition ${
                current === key ? "bg-neutral-50 font-semibold" : ""
              }`}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: theme.swatch }}
              />

              {theme.label}
            </button>
          ))}
      </div>

      {/* WALLPAPERS */}
      <p className="text-[11px] font-semibold text-neutral-400 px-1 mb-2">
        WALLPAPERS
      </p>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(THEMES)
          .filter(([, theme]) => theme.type === "wallpaper")
          .map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`relative overflow-hidden rounded-xl border transition ${
                current === key
                  ? "border-brand-pink ring-2 ring-brand-pink/20"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <img
                src={theme.wallpaper}
                alt={theme.label}
                className="w-full h-16 object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 bg-black/35 text-white text-[11px] font-medium py-1">
                {theme.label}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
