export default function AuthShowcase({ eyebrow, title, line1, line2 }) {
  return (
    <div className="hidden md:flex relative flex-col justify-between overflow-hidden bg-canvas p-12 lg:p-16">
      {/* ambient gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 w-[26rem] h-[26rem] rounded-full bg-rose/30 blur-[110px] animate-drift-slow" />
        <div className="absolute bottom-[-6rem] right-[-4rem] w-[24rem] h-[24rem] rounded-full bg-violet/30 blur-[110px] animate-drift-slower" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:26px_26px]" />
      </div>

      {/* wordmark */}
      <div className="relative z-10 flex items-center gap-2.5">
        <span className="text-gold text-xl leading-none">✦</span>
        <span className="font-serif italic text-2xl text-ivory tracking-tight">
          Gramline
        </span>
      </div>

      {/* headline */}
      <div className="relative z-10 max-w-md">
        <p className="uppercase tracking-[0.28em] text-[11px] text-gold/90 font-body mb-5">
          {eyebrow}
        </p>
        <h1 className="font-serif text-[2.75rem] leading-[1.08] text-ivory mb-5">
          {title}
        </h1>
        <p className="text-white/50 text-[15px] leading-relaxed font-body">
          {line1}
          <br />
          {line2}
        </p>
      </div>

      {/* floating glass preview card — signature element */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="animate-float-card w-64 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full story-ring shrink-0">
              <div className="w-full h-full rounded-full bg-canvas flex items-center justify-center text-[10px] text-ivory font-semibold">
                WT
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-ivory text-xs font-semibold truncate">warisha.creates</p>
              <p className="text-white/40 text-[10px]">Just now</p>
            </div>
          </div>
          <div className="w-full h-28 rounded-lg bg-gradient-to-br from-rose/40 via-violet/30 to-transparent mb-3" />
          <div className="flex items-center gap-4 text-white/60 text-[11px]">
            <span>♥ 2,481</span>
            <span>💬 96</span>
            <span className="ml-auto text-gold/80">✦ saved</span>
          </div>
        </div>

        <p className="font-serif italic text-white/30 text-sm hidden lg:block mb-1">
          est. 2026
        </p>
      </div>
    </div>
  );
}
