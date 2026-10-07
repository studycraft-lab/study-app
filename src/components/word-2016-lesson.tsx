"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import styles from "./word-2016-lesson.module.css";

type TabName = "File" | "Home" | "Insert" | "Design" | "Layout" | "References" | "Mailings" | "Review" | "View" | "Table Tools > Design" | "Table Tools > Layout" | "Chart Tools > Design" | "Chart Tools > Format";
type ObjectName = "none" | "table" | "chart";
type Quiz = { question: string; options: string[]; answer: number; explanation: string };
type Mission = {
  name: string;
  minutes: string;
  idea: string;
  action: string;
  steps: string[];
  hint: string;
  quiz: Quiz;
};

const missions: Mission[] = [
  {
    name: "Find your way around",
    minutes: "3 min",
    idea: "The Ribbon groups commands under tabs. Choose a tab by the job you want to do.",
    action: "You want to add a table. Open the correct Ribbon tab.",
    steps: ["tab:Insert"],
    hint: "Adding something new to a document usually starts in Insert.",
    quiz: { question: "Which tab would you open to show the ruler or change zoom?", options: ["Home", "Insert", "View", "Review"], answer: 2, explanation: "View controls how the document appears on your screen, including the ruler and zoom." },
  },
  {
    name: "Make text stand out",
    minutes: "4 min",
    idea: "Home holds the Font and Paragraph groups. Formatting can change selected text or a whole paragraph.",
    action: "Click the title to select it. On Home, make it bold and centre its paragraph.",
    steps: ["select:Title", "tab:Home", "tool:Bold", "tool:Center"],
    hint: "Click the title first. Bold is in Home → Font; Centre is in Home → Paragraph.",
    quiz: { question: "Which shortcut toggles bold text?", options: ["Ctrl + E", "Ctrl + B", "Ctrl + S", "Ctrl + P"], answer: 1, explanation: "Ctrl + B toggles bold. Ctrl + E centres a paragraph; Ctrl + S saves." },
  },
  {
    name: "Add a table",
    minutes: "4 min",
    idea: "When the cursor is in a table, Word 2016 shows Table Tools with Design and Layout tabs.",
    action: "Insert a table, select its first row, then choose Table Tools → Layout → Repeat Header Rows.",
    steps: ["tab:Insert", "tool:Table", "option:2 × 2 table", "select:Header row", "tab:Table Tools > Layout", "tool:Repeat Header Rows"],
    hint: "Choose a 2 × 2 table from the grid, then click its first row. Under Table Tools, Layout has Repeat Header Rows in the Data group.",
    quiz: { question: "Which Word 2016 contextual tab changes a table's shading and borders?", options: ["Chart Tools → Design", "Review", "Table Tools → Design", "File"], answer: 2, explanation: "Table Tools → Design has table styles, shading, and borders. Table Tools → Layout has Repeat Header Rows in its Data group." },
  },
  {
    name: "Set up the page",
    minutes: "4 min",
    idea: "Design changes the page's appearance. Layout controls page setup, such as margins and line numbering.",
    action: "Choose the DRAFT watermark, then turn on continuous line numbers.",
    steps: ["tab:Design", "tool:Watermark", "option:DRAFT watermark", "tab:Layout", "tool:Line Numbers", "option:Continuous"],
    hint: "Watermark opens a gallery in Design → Page Background. Line Numbers opens a menu in Layout → Page Setup; choose Continuous.",
    quiz: { question: "Where would you change the document margins?", options: ["Home → Font", "Layout → Page Setup", "Review → Proofing", "View → Window"], answer: 1, explanation: "Margins are a page setup choice on the Layout tab." },
  },
  {
    name: "Check and view",
    minutes: "4 min",
    idea: "Review helps proofread. View changes how you look at the document; File manages the document itself.",
    action: "Run Spelling & Grammar, then open Zoom and choose 125%.",
    steps: ["tab:Review", "tool:Spelling & Grammar", "tab:View", "tool:Zoom", "option:125%"],
    hint: "Review → Proofing has Spelling & Grammar. View → Zoom opens the Zoom dialog, where you can choose a percentage.",
    quiz: { question: "You have finished your work. What is the quickest way to save it?", options: ["Ctrl + B", "Ctrl + Z", "Ctrl + S", "Ctrl + J"], answer: 2, explanation: "Ctrl + S saves the current document. You can also choose Save from File." },
  },
  {
    name: "Work with a chart",
    minutes: "5 min",
    idea: "Chart commands appear after the chart is selected. This is why the Ribbon sometimes changes.",
    action: "Insert a column chart, open Chart Tools → Design, and choose Edit Data.",
    steps: ["tab:Insert", "tool:Chart", "option:Column chart", "tab:Chart Tools > Design", "tool:Edit Data"],
    hint: "Choose Column in the Insert Chart dialog. Then use Chart Tools → Design → Data → Edit Data.",
    quiz: { question: "Which chart element explains what each colour or pattern means?", options: ["Watermark", "Header", "Ruler", "Legend"], answer: 3, explanation: "A legend identifies the chart's data series by colour or pattern." },
  },
];

const challenge: Quiz[] = [
  { question: "Mira wants the words 'DRAFT' faintly behind her page. Which path should she use?", options: ["Home → Font → Highlight", "View → Window → Split", "Design → Page Background → Watermark", "Review → Proofing → Spelling"], answer: 2, explanation: "A watermark is faint text or an image behind page content. It belongs to Design's Page Background group." },
  { question: "Choose the correct statements about Line Numbers. 1: They appear in the margin. 2: They show only the line where the cursor is placed.", options: ["Only 2", "Both 1 and 2", "Only 1", "Neither"], answer: 2, explanation: "Line Numbers labels lines along the document margin; it is not a cursor position display." },
  { question: "Which sequence lets you change the values shown in a chart?", options: ["Select chart → Review → Track Changes", "Select chart → Chart Tools → Design → Edit Data", "Insert → Table → Repeat Header Rows", "View → Zoom → Edit Data"], answer: 1, explanation: "Selecting a chart reveals Chart Tools. Its Design tab has Edit Data in the Data group." },
  { question: "Which tab contains the tools for margins, orientation, and line numbers?", options: ["Home", "Layout", "References", "Mailings"], answer: 1, explanation: "These are page setup commands on Layout." },
  { question: "A child has the cursor in a table and wants to change its borders and shading. Which contextual tab is most useful?", options: ["Chart Tools → Design", "Review", "File", "Table Tools → Design"], answer: 3, explanation: "Word 2016 shows Design under Table Tools when the cursor is in a table. It has table styles, shading, and borders." },
];

const baseTabs: TabName[] = ["File", "Home", "Insert", "Design", "Layout", "References", "Mailings", "Review", "View"];
const ribbon: Partial<Record<TabName, { group: string; tools: string[] }[]>> = {
  Home: [{ group: "Font", tools: ["Bold", "Italic", "Underline"] }, { group: "Paragraph", tools: ["Left", "Center", "Bullets"] }],
  Insert: [{ group: "Tables", tools: ["Table"] }, { group: "Illustrations", tools: ["Pictures", "Chart"] }],
  Design: [{ group: "Page Background", tools: ["Watermark", "Page Borders"] }],
  Layout: [{ group: "Page Setup", tools: ["Margins", "Orientation", "Line Numbers"] }],
  References: [{ group: "Table of Contents", tools: ["Table of Contents"] }, { group: "Footnotes", tools: ["Insert Footnote"] }],
  Mailings: [{ group: "Create", tools: ["Labels"] }, { group: "Start Mail Merge", tools: ["Start Mail Merge"] }],
  Review: [{ group: "Proofing", tools: ["Spelling & Grammar"] }, { group: "Tracking", tools: ["Track Changes"] }],
  View: [{ group: "Show", tools: ["Ruler"] }, { group: "Zoom", tools: ["Zoom"] }, { group: "Window", tools: ["Split"] }],
  "Table Tools > Design": [{ group: "Table Styles", tools: ["Shading"] }, { group: "Borders", tools: ["Borders"] }],
  "Table Tools > Layout": [{ group: "Data", tools: ["Repeat Header Rows"] }, { group: "Rows & Columns", tools: ["Insert Above", "Insert Below"] }],
  "Chart Tools > Design": [{ group: "Chart Layouts", tools: ["Add Chart Element"] }, { group: "Data", tools: ["Edit Data"] }],
  "Chart Tools > Format": [{ group: "Current Selection", tools: ["Format Selection"] }],
};

function stepLabel(step: string) { return step.replace(/^tab:/, "Open ").replace(/^tool:/, "Choose ").replace(/^option:/, "Choose ").replace(/^select:Header row$/, "Select the first table row").replace(/^select:Title$/, "Select the title").replaceAll(" > ", " → "); }

export function Word2016Lesson({ childName }: { childName?: string }) {
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  const [selectedObject, setSelectedObject] = useState<ObjectName>("none");
  const [bold, setBold] = useState(false);
  const [centered, setCentered] = useState(false);
  const [titleSelected, setTitleSelected] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [dataEdited, setDataEdited] = useState(false);
  const [headersRepeated, setHeadersRepeated] = useState(false);
  const [headerRowSelected, setHeaderRowSelected] = useState(false);
  const [openMenu, setOpenMenu] = useState<"Table" | "Chart" | "Watermark" | "Line Numbers" | "Zoom" | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [challengeScore, setChallengeScore] = useState(0);
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [hintOpen, setHintOpen] = useState(false);
  const [notice, setNotice] = useState("Choose a Ribbon tab to begin.");
  const mission = missions[missionIndex];
  const expected = mission.steps[stepIndex];
  const activityDone = stepIndex >= mission.steps.length;
  const quizDone = choice === mission.quiz.answer;
  const contextualTabs: TabName[] = selectedObject === "table" ? ["Table Tools > Design", "Table Tools > Layout"] : selectedObject === "chart" ? ["Chart Tools > Design", "Chart Tools > Format"] : [];

  function interact(id: string) {
    if (stage !== "missions") return;
    if (id.startsWith("tab:")) { setActiveTab(id.slice(4) as TabName); setOpenMenu(null); }
    if (id === "tool:Table") setOpenMenu("Table");
    if (id === "option:2 × 2 table") { setSelectedObject("table"); setHeaderRowSelected(false); setOpenMenu(null); setNotice("2 × 2 table inserted. The cursor is inside it, so Table Tools → Design and Layout appear."); }
    if (id === "tool:Chart") setOpenMenu("Chart");
    if (id === "option:Column chart") { setSelectedObject("chart"); setOpenMenu(null); setNotice("Column chart inserted and selected. Chart Tools → Design and Format appear."); }
    if (id === "select:Header row") { setSelectedObject("table"); setHeaderRowSelected(true); setNotice("First table row selected. Now use Table Tools → Layout → Repeat Header Rows."); }
    if (id === "select:Title") { setTitleSelected(true); setNotice("Title selected. Home → Font has Bold; Home → Paragraph has Centre."); }
    if (id === "tool:Bold" && titleSelected) setBold(true);
    if (id === "tool:Center" && titleSelected) setCentered(true);
    if ((id === "tool:Bold" || id === "tool:Center") && !titleSelected) { setNotice("Select the title before changing its formatting."); return; }
    if (id === "tool:Watermark") setOpenMenu("Watermark");
    if (id === "tool:Line Numbers") setOpenMenu("Line Numbers");
    if (id === "option:DRAFT watermark") { setWatermark(true); setOpenMenu(null); }
    if (id === "option:Continuous") { setLineNumbers(true); setOpenMenu(null); }
    if (id === "tool:Zoom") setOpenMenu("Zoom");
    if (id === "option:125%") { setZoomed(true); setOpenMenu(null); }
    if (id === "tool:Spelling & Grammar") setNotice("Spelling & Grammar check opened for this document.");
    if (id === "tool:Edit Data") setDataEdited(true);
    if (id === "tool:Repeat Header Rows" && headerRowSelected) setHeadersRepeated(true);
    if (id === "tool:Repeat Header Rows" && !headerRowSelected) { setNotice("Select the first table row before choosing Repeat Header Rows."); return; }
    if (id === expected) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setNotice(next === mission.steps.length ? "Nice work! Answer the check to finish this part." : `Next: ${stepLabel(mission.steps[next])}.`);
    } else if (!activityDone) {
      setNotice(`That tool is useful, but this mission needs: ${stepLabel(expected)}.`);
    }
  }

  function advance() {
    setChoice(null);
    setHintOpen(false);
    setStepIndex(0);
    if (missionIndex === missions.length - 1) {
      setStage("challenge");
    } else {
      setMissionIndex(missionIndex + 1);
      setNotice("Follow the steps in the mission card.");
    }
  }

  function restart() {
    setMissionIndex(0); setStepIndex(0); setActiveTab("Home"); setSelectedObject("none");
    setBold(false); setCentered(false); setTitleSelected(false); setWatermark(false); setLineNumbers(false);
    setZoomed(false); setDataEdited(false); setHeadersRepeated(false); setHeaderRowSelected(false); setChoice(null); setChallengeIndex(0);
    setChallengeChoice(null); setChallengeScore(0); setStage("missions");
    setHintOpen(false); setOpenMenu(null); setNotice("Choose a Ribbon tab to begin.");
  }

  function advanceChallenge() {
    if (challengeChoice === null) return;
    const score = challengeScore + (challengeChoice === challenge[challengeIndex].answer ? 1 : 0);
    setChallengeScore(score);
    setChallengeChoice(null);
    if (challengeIndex === challenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  const progress = stage === "missions" ? (missionIndex / (missions.length + 1)) * 100 : stage === "challenge" ? ((missions.length + challengeIndex / challenge.length) / (missions.length + 1)) * 100 : 100;

  return <main className={styles.root}>
    <div className={styles.siteNav}><AppHeader role="child" childName={childName} /></div>
    <header className={styles.header}>
      <div className={styles.brand}><span className={styles.brandMark}>W</span><span><strong>Word Mission Lab</strong><small>GRADE 6 ICSO · INTERACTIVE LESSON</small></span></div>
      <span className={styles.lessonTag}>Interactive lesson</span>
    </header>
    <section className={styles.hero}>
      <div><p className={styles.kicker}>Learn by doing · about 28 minutes</p><h1>Learn key MS Word 2016 tools, one mission at a time.</h1><p>Try a tool in the practice Ribbon, then answer a short Olympiad-style check. You can explore freely; the next step is always shown.</p></div>
      <div className={styles.heroStat}><strong>{stage === "complete" ? "Done" : stage === "challenge" ? "Final" : `${missionIndex + 1} / 6`}</strong><span>{stage === "complete" ? "mission complete" : stage === "challenge" ? "challenge" : "short missions"}</span></div>
    </section>
    <div className={styles.progressArea}><div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div><div className={styles.progressLabels}><span>Start</span><span>Six missions</span><span>Challenge</span><span>Finish</span></div></div>

    {stage === "missions" && <div className={styles.lessonGrid}>
      <section className={styles.workspace} aria-label="Interactive Word practice desk">
        <div className={styles.windowTop}><span className={styles.windowDots}>● ● ●</span><span>School project.docx</span><span className={styles.simTag}>PRACTICE DESK</span></div>
        <div className={styles.tabBar} role="tablist" aria-label="Practice Ribbon tabs">
          {baseTabs.map(tabName => <button key={tabName} type="button" role="tab" aria-selected={activeTab === tabName} className={activeTab === tabName ? styles.activeTab : ""} onClick={() => interact(`tab:${tabName}`)}>{tabName}</button>)}
          {contextualTabs.length > 0 && <div className={styles.contextTabGroup} role="group" aria-label={selectedObject === "table" ? "Table Tools" : "Chart Tools"}><span>{selectedObject === "table" ? "TABLE TOOLS" : "CHART TOOLS"}</span><div>{contextualTabs.map(tabName => <button key={tabName} type="button" role="tab" aria-label={tabName} aria-selected={activeTab === tabName} className={activeTab === tabName ? styles.activeTab : ""} onClick={() => interact(`tab:${tabName}`)}>{tabName.split(" > ")[1]}</button>)}</div></div>}
        </div>
        {activeTab === "File" ? <div className={styles.backstage} aria-label="File Backstage view"><strong>File · Backstage view</strong><p>In Word 2016, File opens this separate document management view.</p><button type="button" onClick={() => interact("tool:Save")}>Save</button><button type="button" onClick={() => interact("tool:Print")}>Print</button></div> : <><div className={styles.ribbon} aria-label={`${activeTab} Ribbon tools`}>{(ribbon[activeTab] ?? []).map(group => <div className={styles.ribbonGroup} key={group.group}><div className={styles.toolList}>{group.tools.map(tool => <button key={tool} type="button" onClick={() => interact(`tool:${tool}`)} className={styles.tool}><span className={styles.toolIcon} aria-hidden="true">{tool === "Bold" ? "B" : tool === "Italic" ? "I" : tool === "Underline" ? "U" : tool === "Center" ? "≡" : tool === "Table" ? "▦" : tool === "Chart" ? "▥" : tool === "Watermark" ? "◈" : tool === "Zoom" ? "⌕" : "✦"}</span>{tool}</button>)}</div><span className={styles.groupLabel}>{group.group}</span></div>)}</div>
        {openMenu && <div className={styles.commandMenu} role="group" aria-label={`${openMenu} choices`}><span>{openMenu === "Table" ? "Table size grid" : openMenu === "Chart" ? "Insert Chart dialog" : openMenu === "Watermark" ? "Watermark gallery" : openMenu === "Zoom" ? "Zoom dialog" : "Line Numbers menu"}</span><button type="button" onClick={() => interact(openMenu === "Table" ? "option:2 × 2 table" : openMenu === "Chart" ? "option:Column chart" : openMenu === "Watermark" ? "option:DRAFT watermark" : openMenu === "Zoom" ? "option:125%" : "option:Continuous")}>{openMenu === "Table" ? "2 × 2 table" : openMenu === "Chart" ? "Column chart" : openMenu === "Watermark" ? "DRAFT watermark" : openMenu === "Zoom" ? "125%" : "Continuous"}</button></div>}
        <div className={styles.documentSurface}><article className={`${styles.document} ${zoomed ? styles.documentZoomed : ""}`}>
          {watermark && <span className={styles.watermark}>DRAFT</span>}
          <div className={styles.docContent}>{lineNumbers && <div className={styles.lineNumbers} aria-label="Document line numbers">1<br />2<br />3<br />4<br />5<br />6</div>}
            <div className={styles.docBody}><h2 className={`${bold ? styles.bold : ""} ${centered ? styles.centered : ""}`}><button type="button" className={`${styles.titleSelect} ${titleSelected ? styles.titleSelected : ""}`} onClick={() => interact("select:Title")} aria-label="Select the title">My school project</button></h2><p>Our class is learning to make clear documents. A good title and a tidy page help readers find the important ideas.</p>
              {selectedObject === "table" && <><div className={styles.sampleTable}><button type="button" className={`${styles.tableHeaderRow} ${headerRowSelected ? styles.tableHeaderSelected : ""}`} onClick={() => interact("select:Header row")} aria-label="Select the first table row"><span>Topic</span><span>Tool</span></button><span>Text</span><span>Bold</span></div>{headersRepeated && <small className={styles.docNote}>Header row set to repeat if this table continues onto another page.</small>}</>}
              {selectedObject === "chart" && <button type="button" className={styles.sampleChart} onClick={() => { setSelectedObject("chart"); setActiveTab("Chart Tools > Design"); setNotice("Chart selected. Chart Tools → Design and Format are visible."); }} aria-label="Select sample chart"><strong>Class survey</strong><span className={styles.barOne} /><span className={styles.barTwo} /><span className={styles.barThree} /><small>{dataEdited ? "Data table opened" : "Select chart for its tools"}</small></button>}
              <p className={styles.docFooter}>Prepared for the computer club</p>
            </div>
          </div>
        </article></div></>}
        <p className={styles.status} aria-live="polite"><span>●</span>{notice}</p>
      </section>

      <aside className={styles.lessonPanel}>
        <div className={styles.missionMeta}><span>MISSION {missionIndex + 1} OF 6</span><span>{mission.minutes}</span></div>
        <h2>{mission.name}</h2><p className={styles.idea}>{mission.idea}</p>
        <div className={styles.actionCard}><span className={styles.cardLabel}>DO THIS IN THE PRACTICE DESK</span><strong>{mission.action}</strong><ol>{mission.steps.map((step, index) => <li key={`${step}-${index}`} className={index < stepIndex ? styles.stepDone : index === stepIndex ? styles.stepCurrent : ""}>{stepLabel(step)}</li>)}</ol><button type="button" className={styles.hintButton} onClick={() => setHintOpen(!hintOpen)} aria-expanded={hintOpen}>{hintOpen ? "Hide hint" : "Need a hint?"}</button>{hintOpen && <p className={styles.hint}>{mission.hint}</p>}</div>
        <div className={styles.checkCard}><span className={styles.cardLabel}>QUICK CHECK</span><h3>{mission.quiz.question}</h3><div className={styles.options}>{mission.quiz.options.map((option, index) => <button key={option} type="button" className={`${styles.option} ${choice === index ? (index === mission.quiz.answer ? styles.correct : styles.incorrect) : ""}`} onClick={() => setChoice(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{choice !== null && <p className={`${styles.answerFeedback} ${quizDone ? styles.goodFeedback : styles.tryFeedback}`} aria-live="polite">{quizDone ? "Correct. " : "Try again. "}{mission.quiz.explanation}</p>}</div>
        <button type="button" className={styles.primaryButton} disabled={!activityDone || !quizDone} onClick={advance}>{missionIndex === missions.length - 1 ? "Start final challenge" : "Next mission →"}</button><p className={styles.continueNote}>{activityDone && quizDone ? "Part complete. Move on when ready." : "Complete the desk task and quick check to continue."}</p>
      </aside>
    </div>}

    {stage === "challenge" && <section className={styles.challenge}><div className={styles.challengeIntro}><p className={styles.kicker}>Final challenge · about 4 minutes</p><h2>Think like an Olympiad solver.</h2><p>These are original practice questions inspired by the recent ICSO paper formats and the chapter bank.</p></div><div className={styles.challengeCard}><span className={styles.cardLabel}>QUESTION {challengeIndex + 1} OF {challenge.length}</span><h3>{challenge[challengeIndex].question}</h3><div className={styles.options}>{challenge[challengeIndex].options.map((option, index) => <button key={option} type="button" disabled={challengeChoice !== null} className={`${styles.option} ${challengeChoice === index ? (index === challenge[challengeIndex].answer ? styles.correct : styles.incorrect) : ""}`} onClick={() => setChallengeChoice(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{challengeChoice !== null && <p className={`${styles.answerFeedback} ${challengeChoice === challenge[challengeIndex].answer ? styles.goodFeedback : styles.tryFeedback}`}>{challengeChoice === challenge[challengeIndex].answer ? "Correct. " : "The answer is " + String.fromCharCode(65 + challenge[challengeIndex].answer) + ". "}{challenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primaryButton} disabled={challengeChoice === null} onClick={advanceChallenge}>{challengeIndex === challenge.length - 1 ? "See result" : "Next question →"}</button></div></section>}

    {stage === "complete" && <section className={styles.complete}><span className={styles.completeIcon}>✓</span><p className={styles.kicker}>Mission complete</p><h2>You finished Word Mission Lab.</h2><p>You scored <strong>{challengeScore} out of {challenge.length}</strong> in the final challenge. You explored Ribbon tabs, formatting, tables, page setup, proofing, and charts.</p><button type="button" className={styles.primaryButton} onClick={restart}>Try again</button></section>}

    <footer className={styles.footer}><span>Practice simulation: menus show representative choices; no Word file is changed.</span><span>Based on the Grade 6 ICSO synopsis, chapter bank, and recent papers.</span></footer>
  </main>;
}
