import type { Scene, SceneElement } from "@/lib/tutor/types";

/** Only validated primitives reach React; uploaded SVG/HTML strings are never inserted. */
export function TutorBoard({ scene }: { scene: Scene }) {
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
    return <g key={element.id}><title>{element.label}</title>{shape}</g>;
  }
  return <svg role="img" aria-label={scene.label} viewBox="0 0 1000 1000" style={{ width: "100%", maxWidth: 600, background: "#ffffff" }}>{scene.elements.filter(e => !grouped.has(e.id)).map(draw)}</svg>;
}
