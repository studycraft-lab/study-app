type ConstellationStatus = "pending" | "correct" | "partial" | "review" | "incorrect";

type MasteryConstellationProps = {
  className?: string;
  label: string;
  progress?: number;
  statuses?: ConstellationStatus[];
};

const stars = [
  { x: 24, y: 100 },
  { x: 63, y: 55 },
  { x: 101, y: 89 },
  { x: 139, y: 35 },
  { x: 176, y: 72 },
  { x: 214, y: 42 },
  { x: 253, y: 82 },
  { x: 232, y: 128 },
  { x: 167, y: 118 },
  { x: 89, y: 140 },
] as const;

function progressStatuses(progress: number): ConstellationStatus[] {
  const litStars = Math.round((Math.max(0, Math.min(100, progress)) / 100) * stars.length);
  return stars.map((_, index) => index < litStars ? "correct" : "pending");
}

export function MasteryConstellation({ className = "", label, progress = 0, statuses }: MasteryConstellationProps) {
  const visibleStars = statuses?.length ? stars.slice(0, Math.min(stars.length, statuses.length)) : stars;
  const resolved = statuses?.length ? visibleStars.map((_, index) => statuses[index] ?? "pending") : progressStatuses(progress);

  return <svg className={`mastery-constellation ${className}`.trim()} viewBox="0 0 280 170" role="img" aria-label={label} focusable="false">
    <g className="constellation-lines" aria-hidden="true">
      {visibleStars.slice(1).map((star, index) => {
        const previous = visibleStars[index];
        const lit = resolved[index] !== "pending" && resolved[index + 1] !== "pending";
        return <line className={lit ? "is-lit" : ""} key={`${previous.x}-${star.x}`} x1={previous.x} y1={previous.y} x2={star.x} y2={star.y} />;
      })}
      {visibleStars.length > 8 && <line className={resolved[8] !== "pending" && resolved[2] !== "pending" ? "is-lit" : ""} x1="167" y1="118" x2="101" y2="89" />}
      {visibleStars.length > 7 && <line className={resolved[7] !== "pending" && resolved[5] !== "pending" ? "is-lit" : ""} x1="232" y1="128" x2="214" y2="42" />}
    </g>
    <g className="constellation-stars" aria-hidden="true">
      {visibleStars.map((star, index) => <g className={`constellation-star is-${resolved[index]}`} key={`${star.x}-${star.y}`} transform={`translate(${star.x} ${star.y})`} style={{ animationDelay: `${index * 55}ms` }}>
        <circle className="star-aura" r={resolved[index] === "pending" ? 6 : 11} />
        <circle className="star-core" r={resolved[index] === "pending" ? 3.25 : 4.5} />
        {resolved[index] !== "pending" && <path className="star-spark" d="M0 -10 L1.6 -2 L9 0 L1.6 2 L0 10 L-1.6 2 L-9 0 L-1.6 -2 Z" />}
      </g>)}
    </g>
  </svg>;
}

export type { ConstellationStatus };
