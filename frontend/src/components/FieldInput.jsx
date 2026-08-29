export default function FieldInput({ label, ...props }) {
  return (
    <label className="block group">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-400 mb-2 font-body group-focus-within:text-rose transition-colors">
        {label}
      </span>
      <input
        {...props}
        className="w-full bg-transparent border-0 border-b border-neutral-200 pb-2.5 text-[15px] text-ink placeholder:text-neutral-300 outline-none focus:border-rose transition-colors font-body"
      />
    </label>
  );
}
