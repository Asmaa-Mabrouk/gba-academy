export default function Loading() {
  return (
    <div className="container-x py-32 text-center" role="status" aria-live="polite">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
    </div>
  );
}
