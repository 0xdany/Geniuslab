export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(230,0,95,0.08),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(24,26,36,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,26,36,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
    </div>
  );
}
