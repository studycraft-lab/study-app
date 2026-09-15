import type { Scene, SceneElement, SceneAction } from "@/lib/tutor/types";

/** Only validated primitives reach React; uploaded SVG/HTML strings are never inserted. */
export function TutorBoard({ scene, actions = [], focusId, paused = false }: { scene: Scene; actions?: SceneAction[]; focusId?: string | null; paused?: boolean }) {
  const grouped = new Set(scene.elements.flatMap(e => e.kind === "group" ? e.children : []));
  function draw(element: SceneElement): React.ReactNode {
    const props = { fill: element.fill, "aria-label": element.label };
    let shape: React.ReactNode;
    switch (element.kind) {
      case "group": shape = <g {...props} transform={`translate(${element.x} ${element.y})`}>{element.children.map(id => draw(scene.elements.find(e => e.id === id)!))}</g>; break;
      case "text": shape = <text {...props} x={element.x} y={element.y} fontSize={element.fontSize}>{element.text}</text>; break;
      case "rect": shape = <rect {...props} x={element.x} y={element.y} width={element.width} height={element.height} />; break;
      case "ellipse": shape = <ellipse {...props} cx={element.x} cy={element.y} rx={element.rx} ry={element.ry} />; break;
      case "path": shape = <path {...props} d={element.d} transform={`translate(${element.x} ${element.y})`} />; break;
    }
    const elementActions = actions.filter(a => a.target === element.id);
    const highlighted = focusId === element.id || elementActions.some(a => a.kind === "highlight");
    const animated = elementActions.reduceRight((content, action, index) => <g key={index} className={`tutor-element tutor-${action.kind}`} style={{ "--tutor-duration": `${action.durationMs}ms`, "--tutor-dx": `${action.dx ?? 0}px`, "--tutor-dy": `${action.dy ?? 0}px`, animationPlayState: paused ? "paused" : "running" } as React.CSSProperties}>{content}</g>, shape);
    return <g key={element.id} stroke={highlighted ? "#b35400" : undefined} strokeWidth={highlighted ? 3 : undefined}><title>{element.label}</title>{animated}</g>;
  }
  return <svg role="img" aria-label={scene.label} viewBox="0 0 1000 1000" style={{ width: "100%", maxWidth: 600, background: "#ffffff" }}>{scene.elements.filter(e => !grouped.has(e.id)).map(draw)}</svg>;
}
