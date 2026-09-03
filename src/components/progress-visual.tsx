type ProgressVisualStatus = "pending" | "correct" | "partial" | "review" | "incorrect";

type ProgressVisualProps = {
  className?: string;
  label: string;
  progress?: number;
  statuses?: ProgressVisualStatus[];
};

const nodes = [
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

function progressStatuses(progress: number): ProgressVisualStatus[] {
  const completedNodes = Math.round((Math.max(0, Math.min(100, progress)) / 100) * nodes.length);
  return nodes.map((_, index) => index < completedNodes ? "correct" : "pending");
}

export function ProgressVisual({ className = "", label, progress = 0, statuses }: ProgressVisualProps) {
  const visibleNodes = statuses?.length ? nodes.slice(0, Math.min(nodes.length, statuses.length)) : nodes;
  const resolved = statuses?.length ? visibleNodes.map((_, index) => statuses[index] ?? "pending") : progressStatuses(progress);

  return <svg className={`progress-visual ${className}`.trim()} viewBox="0 0 280 170" role="img" aria-label={label} focusable="false">
    <g className="progress-lines" aria-hidden="true">
      {visibleNodes.slice(1).map((node, index) => {
        const previous = visibleNodes[index];
        const completed = resolved[index] !== "pending" && resolved[index + 1] !== "pending";
        return <line className={completed ? "is-complete" : ""} key={`${previous.x}-${node.x}`} x1={previous.x} y1={previous.y} x2={node.x} y2={node.y} />;
      })}
      {visibleNodes.length > 8 && <line className={resolved[8] !== "pending" && resolved[2] !== "pending" ? "is-complete" : ""} x1="167" y1="118" x2="101" y2="89" />}
      {visibleNodes.length > 7 && <line className={resolved[7] !== "pending" && resolved[5] !== "pending" ? "is-complete" : ""} x1="232" y1="128" x2="214" y2="42" />}
    </g>
    <g className="progress-nodes" aria-hidden="true">
      {visibleNodes.map((node, index) => <g className={`progress-node is-${resolved[index]}`} key={`${node.x}-${node.y}`} transform={`translate(${node.x} ${node.y})`} style={{ animationDelay: `${index * 55}ms` }}>
        <circle className="node-ring" r={resolved[index] === "pending" ? 6 : 10} />
        <circle className="node-core" r={resolved[index] === "pending" ? 3.25 : 5} />
      </g>)}
    </g>
  </svg>;
}

export type { ProgressVisualStatus };
export { ProgressVisual as MasteryConstellation };
export type ConstellationStatus = ProgressVisualStatus;
