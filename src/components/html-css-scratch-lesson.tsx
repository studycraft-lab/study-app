"use client";

import { useState } from "react";
import Image from "next/image";
import { AppHeader } from "./app-header";
import styles from "./html-css-scratch-lesson.module.css";

type Question = { prompt: string; options: string[]; answer: number; explanation: string };
type Mission = { title: string; minutes: number; idea: string; task: string; steps: { action: string; label: string }[]; hint: string; question: Question };

const missions: Mission[] = [
  {
    title: "Map a web page", minutes: 3,
    idea: "An HTML document has a head for page information and a body for visible content. The title goes inside the head and appears on the browser tab.",
    task: "Explore the head, its title, and then the body.",
    steps: [{ action: "part:head", label: "Open <head>" }, { action: "part:title", label: "Find <title> inside the head" }, { action: "part:body", label: "Open <body>" }],
    hint: "The title belongs inside the head. Headings and paragraphs belong in the body.",
    question: { prompt: "Where does the text shown on a browser tab come from?", options: ["<body>", "<title> inside <head>", "<p>", "<h1>"], answer: 1, explanation: "The title element belongs in the head and names the browser tab." },
  },
  {
    title: "Add visible content", minutes: 4,
    idea: "A heading and a paragraph are elements in the body. Their closing tags mark where the content ends.",
    task: "Add a heading, then a paragraph to the practice page.",
    steps: [{ action: "html:heading", label: "Add <h1> heading" }, { action: "html:paragraph", label: "Add <p> paragraph" }],
    hint: "Choose tags from the HTML toolbar. Watch the code and preview change together.",
    question: { prompt: "Which code creates a paragraph?", options: ["<head>Hello</head>", "<p>Hello</p>", "<title>Hello</title>", "<img>Hello</img>"], answer: 1, explanation: "The p element marks a paragraph of visible content." },
  },
  {
    title: "Add a link and image", minutes: 4,
    idea: "Attributes add information to an opening tag. href gives a link its destination; src names an image file; alt describes the image.",
    task: "Add a link with href, then an image with src and alt.",
    steps: [{ action: "html:link", label: "Add <a> link" }, { action: "html:href", label: "Set href destination" }, { action: "html:image", label: "Add <img> image" }, { action: "html:srcalt", label: "Set src and alt" }],
    hint: "The link is an <a> element. The image needs a source and a useful text alternative.",
    question: { prompt: "Which attribute tells a link where to go?", options: ["alt", "src", "href", "color"], answer: 2, explanation: "href holds the destination for an anchor link." },
  },
  {
    title: "Style it with CSS", minutes: 4,
    idea: "HTML supplies structure. CSS changes appearance. An internal stylesheet lives inside <style>, usually in the head.",
    task: "Add an internal <style> block and turn the heading teal.",
    steps: [{ action: "css:style", label: "Add <style> in the head" }, { action: "css:selector", label: "Choose the h1 selector" }, { action: "css:color", label: "Set color: teal" }],
    hint: "The CSS rule should target h1, then give its color property a value.",
    question: { prompt: "Which is an internal way to add CSS to an HTML document?", options: ["A <style> element in <head>", "A <p> element in <body>", "An <img> element", "A Scratch Motion block"], answer: 0, explanation: "An internal stylesheet uses a style element, usually in the document head." },
  },
  {
    title: "Explore Scratch", minutes: 4,
    idea: "Scratch programs run on the Stage. A sprite is a character. Blocks come from the palette and snap together in the script area.",
    task: "Find the Stage, the sprite, the blocks palette, and the script area.",
    steps: [{ action: "scratch:stage", label: "Select the Stage" }, { action: "scratch:sprite", label: "Select the sprite" }, { action: "scratch:palette", label: "Select the blocks palette" }, { action: "scratch:scripts", label: "Select the script area" }],
    hint: "The Stage is where the project plays. The script area is where blocks are assembled.",
    question: { prompt: "Where do you snap Scratch blocks together to make a program?", options: ["Stage", "Sprite list", "Script area", "Backdrop"], answer: 2, explanation: "Blocks are assembled in the script area; their result appears on the Stage." },
  },
  {
    title: "Make the sprite move", minutes: 5,
    idea: "Events start a script. Control blocks repeat instructions. Motion blocks move a sprite. Order matters.",
    task: "Build: when green flag clicked → repeat 10 → move 10 steps. Then run it.",
    steps: [{ action: "block:event", label: "Add when green flag clicked" }, { action: "block:repeat", label: "Add repeat (10)" }, { action: "block:move", label: "Put move (10) steps inside repeat" }, { action: "block:run", label: "Click the green flag to run" }],
    hint: "Events starts the stack. Control repeats the nested Motion command ten times.",
    question: { prompt: "Which Scratch block category contains repeat?", options: ["Motion", "Looks", "Control", "Sound"], answer: 2, explanation: "Repeat is a Control block. Move is a Motion block; the green flag starter is an Events block." },
  },
];

const challenge: Question[] = [
  { prompt: "Choose the correct match for an HTML document.", options: ["<head> — visible paragraph", "<title> — browser tab name", "<body> — CSS selector", "<h1> — image source"], answer: 1, explanation: "The title element names the browser tab. Visible page content goes in the body." },
  { prompt: "Which tag and attribute pair gives an image a useful text alternative?", options: ["<img src=\"planet.svg\" alt=\"Planet Earth\">", "<a href=\"Planet Earth\">", "<p src=\"Planet Earth\">", "<title color=\"Planet Earth\">"], answer: 0, explanation: "alt on img supplies replacement text for the image." },
  { prompt: "A child wants all h1 headings to appear teal. Which rule is CSS?", options: ["<h1>color = teal</h1>", "h1 { color: teal; }", "when h1 clicked → teal", "href = teal"], answer: 1, explanation: "A CSS rule has a selector followed by property and value declarations." },
  { prompt: "Which statements are correct? 1. HTML gives a page structure. 2. CSS controls its appearance.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both statements describe the roles of HTML and CSS." },
  { prompt: "The sprite should move 10 steps, ten times, after the green flag is clicked. Which order works?", options: ["Motion → Events → Looks", "Events → Control repeat → Motion move", "Control repeat → Sound → Events", "Looks → Motion → CSS"], answer: 1, explanation: "The Events block starts the script; Control repeats the nested Motion block." },
  { prompt: "What happens when you press Stop while a Scratch script is running?", options: ["The script starts over", "The script stops", "The backdrop changes", "The sprite disappears forever"], answer: 1, explanation: "The green flag starts a script; Stop halts running scripts." },
];

const htmlParts = [
  { action: "part:head", label: "<head>", detail: "Page information, hidden from the page itself" },
  { action: "part:title", label: "<title>", detail: "The browser tab name, inside the head" },
  { action: "part:body", label: "<body>", detail: "Visible content lives here" },
];
const htmlTools = [
  { action: "html:heading", label: "Add <h1>", category: "Structure" },
  { action: "html:paragraph", label: "Add <p>", category: "Structure" },
  { action: "html:link", label: "Add <a>", category: "Link" },
  { action: "html:href", label: "Set href", category: "Link" },
  { action: "html:image", label: "Add <img>", category: "Image" },
  { action: "html:srcalt", label: "Set src + alt", category: "Image" },
  { action: "css:style", label: "Add <style>", category: "CSS" },
  { action: "css:selector", label: "Choose h1", category: "CSS" },
  { action: "css:color", label: "color: teal", category: "CSS" },
];
const scratchBlocks = [
  { action: "block:event", label: "when green flag clicked", category: "Events" },
  { action: "block:repeat", label: "repeat (10)", category: "Control" },
  { action: "block:move", label: "move (10) steps", category: "Motion" },
];

export function HtmlCssScratchLesson({ childName }: { childName?: string }) {
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [selectedPart, setSelectedPart] = useState("");
  const [heading, setHeading] = useState(false);
  const [paragraph, setParagraph] = useState(false);
  const [link, setLink] = useState(false);
  const [href, setHref] = useState(false);
  const [image, setImage] = useState(false);
  const [srcAlt, setSrcAlt] = useState(false);
  const [styleTag, setStyleTag] = useState(false);
  const [selector, setSelector] = useState(false);
  const [teal, setTeal] = useState(false);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [spriteX, setSpriteX] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [notice, setNotice] = useState("Follow the highlighted step.");
  const mission = missions[missionIndex];
  const done = stepIndex === mission.steps.length;
  const scratch = missionIndex >= 4;

  function interact(action: string) {
    if (stage !== "missions") return;
    if (action === "block:run" && missionIndex === 5 && done && blocks.length === 3) { setSpriteX(100); setNotice("The script ran again. Ten moves of 10 steps make 100 steps."); return; }
    if (action !== mission.steps[stepIndex]?.action) { setNotice(`Try this step: ${mission.steps[stepIndex]?.label ?? "answer the check"}.`); return; }
    if (action.startsWith("part:") || action.startsWith("scratch:")) setSelectedPart(action);
    if (action === "html:heading") setHeading(true);
    if (action === "html:paragraph") setParagraph(true);
    if (action === "html:link") setLink(true);
    if (action === "html:href") setHref(true);
    if (action === "html:image") setImage(true);
    if (action === "html:srcalt") setSrcAlt(true);
    if (action === "css:style") setStyleTag(true);
    if (action === "css:selector") setSelector(true);
    if (action === "css:color") setTeal(true);
    if (action.startsWith("block:") && action !== "block:run") setBlocks(existing => [...existing, action]);
    if (action === "block:run") setSpriteX(100);
    const next = stepIndex + 1;
    setStepIndex(next);
    setNotice(next === mission.steps.length ? "Nice work. Try the quick check." : `Next: ${mission.steps[next].label}.`);
  }

  function advance() {
    setAnswer(null); setHintOpen(false); setSelectedPart(""); setStepIndex(0); setNotice("Follow the highlighted step.");
    if (missionIndex === missions.length - 1) setStage("challenge");
    else setMissionIndex(missionIndex + 1);
  }

  function advanceChallenge() {
    if (challengeAnswer === null) return;
    setScore(score + Number(challengeAnswer === challenge[challengeIndex].answer));
    setChallengeAnswer(null);
    if (challengeIndex === challenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setMissionIndex(0); setStepIndex(0); setStage("missions"); setSelectedPart(""); setHeading(false); setParagraph(false);
    setLink(false); setHref(false); setImage(false); setSrcAlt(false); setStyleTag(false); setSelector(false); setTeal(false);
    setBlocks([]); setSpriteX(0); setAnswer(null); setChallengeIndex(0); setChallengeAnswer(null); setScore(0);
    setHintOpen(false); setNotice("Follow the highlighted step.");
  }

  const code = [
    "<!DOCTYPE html>", "<html>", "  <head>", "    <title>My Planet Page</title>",
    ...(styleTag ? ["    <style>", ...(selector ? [teal ? "      h1 { color: teal; }" : "      h1 { }"] : ["      /* Choose a selector */"]), "    </style>"] : []),
    "  </head>", "  <body>",
    ...(heading ? ["    <h1>Our Planet</h1>"] : []),
    ...(paragraph ? ["    <p>Earth is our home.</p>"] : []),
    ...(link ? [href ? "    <a href=\"https://example.org\">Learn more</a>" : "    <a>Learn more</a>"] : []),
    ...(image ? [srcAlt ? "    <img src=\"/icso/planet.svg\" alt=\"Planet Earth\">" : "    <img>"] : []),
    "  </body>", "</html>",
  ].join("\n");
  const progress = stage === "complete" ? 100 : stage === "challenge" ? 82 + (challengeIndex / challenge.length) * 18 : (missionIndex / missions.length) * 82;

  return <main className={styles.root}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}><div><p className={styles.eyebrow}>GRADE 6 ICSO · INTERACTIVE LESSON</p><h1>Build a page. Program a sprite.</h1><p>Learn core ideas from the HTML, CSS and Scratch chapter through tiny actions and quick Olympiad-style checks.</p><span>Six parts · about 30 minutes total</span></div><strong className={styles.heroMark}>{scratch ? "🐱" : "</>"}</strong></header>
      <div className={styles.progress} aria-label="Lesson progress"><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.layout}>
        <section className={styles.workbench} aria-label={scratch ? "Scratch practice workbench" : "HTML and CSS practice workbench"}>
          <div className={styles.workbenchTitle}><strong>{scratch ? "Scratch practice" : "index.html"}</strong><span>{scratch ? "Blocks and Stage" : "Code and live preview"}</span></div>
          {!scratch ? <>
            {missionIndex === 0 && <div className={styles.partRow}>{htmlParts.map(part => <button key={part.action} type="button" className={selectedPart === part.action ? styles.selected : ""} onClick={() => interact(part.action)}><strong>{part.label}</strong><small>{part.detail}</small></button>)}</div>}
            {missionIndex > 0 && <div className={styles.toolbar}>{htmlTools.filter(tool => missionIndex === 1 ? tool.category === "Structure" : missionIndex === 2 ? ["Link", "Image"].includes(tool.category) : tool.category === "CSS").map(tool => <button type="button" key={tool.action} onClick={() => interact(tool.action)}>{tool.label}</button>)}</div>}
            <div className={styles.webPanels}><div className={styles.codePanel}><div className={styles.panelLabel}>HTML CODE</div><pre><code>{code}</code></pre></div><div className={styles.previewPanel}><div className={styles.browserBar}><span>◁ ▷ ⟳</span><strong>My Planet Page</strong></div><div className={styles.previewBody}>{heading && <h1 style={{ color: teal ? "teal" : undefined }}>Our Planet</h1>}{paragraph && <p>Earth is our home.</p>}{link && (href ? <a className={styles.fakeLink} href="https://example.org" onClick={event => event.preventDefault()}>Learn more ↗</a> : <span className={styles.fakeLink}>Learn more (no destination yet)</span>)}{image && (srcAlt ? <Image className={styles.planetImage} src="/icso/planet.svg" width={150} height={110} alt="Planet Earth" unoptimized /> : <div className={styles.planetImage}><small>src and alt needed</small></div>)}{!heading && !paragraph && !link && !image && <p className={styles.emptyPreview}>Visible content from the body will appear here.</p>}</div></div></div>
          </> : <div className={styles.scratchPanels}><div className={styles.palette}><button type="button" className={selectedPart === "scratch:palette" ? styles.selected : ""} onClick={() => interact("scratch:palette")}><strong>Blocks palette</strong><small>Pick a category and block</small></button>{missionIndex === 5 && scratchBlocks.map(block => <button type="button" key={block.action} className={`${styles.block} ${styles[block.category.toLowerCase()]}`} onClick={() => interact(block.action)}><small>{block.category}</small>{block.label}</button>)}</div><div className={styles.scriptArea}><button type="button" className={selectedPart === "scratch:scripts" ? styles.selected : ""} onClick={() => interact("scratch:scripts")}><strong>Script area</strong><small>Snap blocks together here</small></button><div className={styles.stack}>{blocks.map(block => { const item = scratchBlocks.find(candidate => candidate.action === block); return item && <div key={block} className={`${styles.block} ${styles[item.category.toLowerCase()]}`}>{item.label}</div>; })}</div></div><div className={styles.stageArea}><button type="button" className={selectedPart === "scratch:stage" ? styles.selected : ""} onClick={() => interact("scratch:stage")}><strong>Stage</strong><small>The project plays here</small></button><div className={styles.stageScene}><span className={styles.cat} style={{ transform: `translateX(${spriteX}px)` }}>🐱</span></div><button type="button" className={styles.spriteButton} onClick={() => interact("scratch:sprite")}><strong>Sprite: Cat</strong><small>A character with scripts</small></button>{missionIndex === 5 && <div className={styles.stageControls}><button type="button" className={styles.flag} onClick={() => interact("block:run")}>▶ Green flag</button><button type="button" className={styles.stop} onClick={() => setSpriteX(0)}>■ Stop</button></div>}</div></div>}
          {!scratch && <details className={styles.extras}><summary>More tags in this chapter</summary><p><code>&lt;ul&gt;</code> with <code>&lt;li&gt;</code> makes a bullet list; <code>&lt;strong&gt;</code> marks important text; <code>&lt;!-- comment --&gt;</code> is a code note that does not appear on the page.</p></details>}
          <div className={styles.workbenchFoot}>{scratch ? spriteX ? "The repeat block ran move 10 steps ten times: 100 steps total." : "The green flag starts a script; the Stop button stops it. Block categories include Motion, Looks, Sound, Events, Control, Sensing, Operators, and Variables." : "The preview shows body content. The browser tab shows the title from the head."}</div>
        </section>
        <aside className={styles.mission}><p className={styles.eyebrow}>PART {missionIndex + 1} OF 6 · {mission.minutes} MIN</p><h2>{mission.title}</h2><p>{mission.idea}</p><div className={styles.task}><strong>Your task</strong><p>{mission.task}</p><ol>{mission.steps.map((step, index) => <li key={step.action} className={index < stepIndex ? styles.done : index === stepIndex ? styles.current : ""}>{step.label}{index < stepIndex ? " ✓" : ""}</li>)}</ol></div><p className={styles.notice} role="status">{notice}</p><button type="button" className={styles.hint} onClick={() => setHintOpen(!hintOpen)}>{hintOpen ? "Hide hint" : "Need a hint?"}</button>{hintOpen && <p className={styles.hintText}>{mission.hint}</p>}
          {done && <div className={styles.check}><strong>Quick check</strong><p>{mission.question.prompt}</p>{mission.question.options.map((option, index) => <button type="button" key={option} aria-pressed={answer === index} className={answer === index ? styles.chosen : ""} onClick={() => setAnswer(index)}>{String.fromCharCode(65 + index)}. {option}</button>)}{answer !== null && <p className={answer === mission.question.answer ? styles.correct : styles.incorrect}>{answer === mission.question.answer ? "Correct. " : "Try again. "}{mission.question.explanation}</p>}{answer === mission.question.answer && <button type="button" className={styles.primary} onClick={advance}>{missionIndex === missions.length - 1 ? "Start final challenge" : "Next part →"}</button>}</div>}
        </aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><p className={styles.eyebrow}>FINAL CHALLENGE · {challengeIndex + 1} OF {challenge.length}</p><h2>Use what you built</h2><p>{challenge[challengeIndex].prompt}</p>{challenge[challengeIndex].options.map((option, index) => <button type="button" key={option} aria-pressed={challengeAnswer === index} disabled={challengeAnswer !== null} className={challengeAnswer === index ? styles.chosen : ""} onClick={() => setChallengeAnswer(index)}>{String.fromCharCode(65 + index)}. {option}</button>)}{challengeAnswer !== null && <p className={challengeAnswer === challenge[challengeIndex].answer ? styles.correct : styles.incorrect}>{challengeAnswer === challenge[challengeIndex].answer ? "Correct. " : `The correct answer is ${String.fromCharCode(65 + challenge[challengeIndex].answer)}. `}{challenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primary} disabled={challengeAnswer === null} onClick={advanceChallenge}>{challengeIndex === challenge.length - 1 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><p className={styles.eyebrow}>LESSON COMPLETE</p><h2>You built a page and programmed a sprite.</h2><p>You answered {score} of {challenge.length} final questions correctly. You can revisit any part by starting again.</p><button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
