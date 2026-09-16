export function ProgressBar({ value, onHero }: { value: number; onHero?: boolean }) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div className={"ui-prog" + (onHero ? " ui-prog--onhero" : "")}>
      <i style={{ width: w + "%" }} />
    </div>
  );
}
