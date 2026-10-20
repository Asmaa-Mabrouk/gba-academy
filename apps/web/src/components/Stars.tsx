export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} / 5`} dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={value >= i - 0.25 ? "#c49c3e" : value >= i - 0.75 ? "url(#half)" : "#e5e1d6"}>
          <defs><linearGradient id="half"><stop offset="50%" stopColor="#c49c3e" /><stop offset="50%" stopColor="#e5e1d6" /></linearGradient></defs>
          <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  );
}
