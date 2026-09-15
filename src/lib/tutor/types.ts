/** Validate untrusted JSON before using these wire types. */
export type ElementBase = { id: string; x: number; y: number; fill: string; label: string };
export type SceneElement = ElementBase & (
  | { kind: "group"; children: string[] }
  | { kind: "text"; text: string; fontSize: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "ellipse"; rx: number; ry: number }
  | { kind: "path"; d: string }
);
export type Scene = { id: string; label: string; elements: SceneElement[] };
export type SceneAction = { kind: "reveal" | "highlight" | "pulse" | "move"; target: string; durationMs: number; dx?: number; dy?: number };
export type Checkpoint = { id: string; prompt: string; options: { id: string; text: string }[]; correctOptionId: string; acceptedAnswers: string[]; criteria: string; hint: string; encouragement: string };
export type TeachingStep = { id: string; factIds: string[]; narration: string; simplerExplanation: string; sceneId: string; focusIds: string[]; actions: SceneAction[]; checkpoint: Checkpoint; nextStepId: string | null };
export type LessonPack = {
  schemaVersion: "1.0";
  lessonId: string;
  contentVersion: number;
  capabilities: ["vector-v1"];
  source: { board: string; grade: number; subject: string; bookTitle: string | null; edition: string | null; chapterId: string; chapterTitle: string; documentName: string; sourceStatus: "synthetic" | "unverified" | "reviewed" };
  section: { id: string; heading: string; path: string[]; printedPages: string[]; pdfPages: number[] };
  goals: string[];
  citations: { id: string; printedPage: string; pdfPage: number | null; locator: string }[];
  facts: { id: string; text: string; citationIds: string[] }[];
  scenes: Scene[];
  steps: TeachingStep[];
  clarifications: { id: string; question: string; answer: string; factIds: string[] }[];
  recap: { text: string; factIds: string[]; sceneId: string };
};
