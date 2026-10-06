"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import styles from "./powerpoint-2016-lesson.module.css";

type Tab = "File" | "Home" | "Insert" | "Design" | "Transitions" | "Animations" | "Slide Show" | "Review" | "View" | "Picture Tools → Format";
type Check = { question: string; choices: string[]; answer: number; why: string };
type Mission = { title: string; time: string; concept: string; task: string; steps: string[]; hint: string; check: Check };

const missions: Mission[] = [
  { title: "Build a slide", time: "3 min", concept: "Home → Slides contains New Slide and Layout. A layout decides where placeholders go.", task: "Add a slide, then give it a Title and Content layout.", steps: ["tab:Home", "tool:New Slide", "tool:Layout", "option:Title and Content"], hint: "Both commands are in Home → Slides.", check: { question: "Which shortcut adds a new slide in PowerPoint 2016?", choices: ["Ctrl + S", "Ctrl + M", "F5", "Ctrl + O"], answer: 1, why: "Ctrl + M inserts a new slide. Ctrl + S saves; F5 starts the slide show." } },
  { title: "Add a picture", time: "4 min", concept: "Insert adds objects. Selecting a picture reveals the contextual Picture Tools → Format tab.", task: "Insert a picture, then use Picture Tools → Format → Crop.", steps: ["tab:Insert", "tool:Pictures", "option:Practice picture", "tab:Picture Tools → Format", "tool:Crop"], hint: "Pictures is on Insert. The contextual Format tab appears after the picture is selected.", check: { question: "A picture is selected. Which contextual tab has Crop in PowerPoint 2016?", choices: ["Picture Tools → Format", "Slide Show", "Transitions", "Review"], answer: 0, why: "Picture Tools → Format appears when a picture is selected and contains Crop." } },
  { title: "Choose a design", time: "3 min", concept: "A theme gives slides a coordinated look. The Design tab also has background choices.", task: "Open Design and apply the practice theme.", steps: ["tab:Design", "tool:Themes", "option:Blue practice theme"], hint: "Look in Design → Themes. The blue theme is a sample for this practice editor.", check: { question: "Which tab changes the presentation's overall theme?", choices: ["Review", "Animations", "Design", "View"], answer: 2, why: "Design contains themes, variants, and background formatting." } },
  { title: "Move between slides", time: "4 min", concept: "A transition happens as one slide changes to another. Duration controls how long that change takes.", task: "Apply Fade to the selected slide and set its duration to 1.5 seconds.", steps: ["tab:Transitions", "tool:Fade", "tool:Duration", "option:1.5 seconds"], hint: "Use Transitions → Transition to This Slide, then the Timing group's Duration control.", check: { question: "A Fade plays when slide 1 changes to slide 2. What is Fade here?", choices: ["An object animation", "A slide transition", "A slide layout", "A font style"], answer: 1, why: "Transitions affect the change between slides; animations affect objects on a slide." } },
  { title: "Move an object", time: "4 min", concept: "An animation affects an object on the slide. Delay waits before its effect starts; Duration is the effect's running time.", task: "Select the picture, add a Fly In animation, then set Delay to 1 second.", steps: ["select:Picture", "tab:Animations", "tool:Fly In", "tool:Delay", "option:1 second"], hint: "Select the picture first. Use the Animations tab, then Delay in Timing.", check: { question: "You want an object to start moving one second after its trigger. Which setting changes this?", choices: ["Transition Duration", "Animation Delay", "Slide Layout", "Theme Variant"], answer: 1, why: "Animation Delay sets the wait before an object's effect begins." } },
  { title: "Review and present", time: "4 min", concept: "Slide Sorter shows slide thumbnails for arranging them. Slide Show presents slides full screen.", task: "Switch to Slide Sorter, then start the slide show from the beginning.", steps: ["tab:View", "tool:Slide Sorter", "tab:Slide Show", "tool:From Beginning"], hint: "Slide Sorter is on View. From Beginning is on Slide Show; F5 is its shortcut.", check: { question: "Which view is best for seeing all slides as thumbnails and rearranging them?", choices: ["Normal", "Slide Sorter", "Presenter View", "Backstage"], answer: 1, why: "Slide Sorter displays slides as thumbnails so you can change their order." } },
];

const finalChecks: Check[] = [
  { question: "Which statement is correct? 1. A transition changes how slides switch. 2. An animation affects an object on a slide.", choices: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, why: "Both statements describe the distinct jobs of transitions and animations." },
  { question: "Which sequence changes the time spent playing a slide transition?", choices: ["Transitions → Duration", "Animations → Delay", "Home → Layout", "Review → Spelling"], answer: 0, why: "Duration in the Transitions tab controls the transition's running time." },
  { question: "Maya wants to show her presentation full screen from slide 1. Which shortcut should she use?", choices: ["Ctrl + M", "Ctrl + B", "F5", "Ctrl + Z"], answer: 2, why: "F5 starts the slide show from the beginning." },
  { question: "Which two commands are in the Home tab's Slides group?", choices: ["Fade and Duration", "New Slide and Layout", "Crop and Corrections", "Spelling and Comments"], answer: 1, why: "Home → Slides contains New Slide and Layout." },
  { question: "A picture is selected and you want to trim its edges. Which path fits PowerPoint 2016?", choices: ["Design → Themes → Crop", "Picture Tools → Format → Crop", "View → Slide Sorter → Crop", "Transitions → Timing → Crop"], answer: 1, why: "Selecting a picture reveals Picture Tools → Format; Crop is on that contextual tab." },
];

const baseTabs: Tab[] = ["File", "Home", "Insert", "Design", "Transitions", "Animations", "Slide Show", "Review", "View"];
const commands: Partial<Record<Tab, { group: string; tools: string[] }[]>> = {
  Home: [{ group: "Slides", tools: ["New Slide", "Layout"] }, { group: "Font", tools: ["Bold", "Italic"] }],
  Insert: [{ group: "Images", tools: ["Pictures"] }, { group: "Illustrations", tools: ["Shapes", "Chart"] }],
  Design: [{ group: "Themes", tools: ["Themes"] }, { group: "Customize", tools: ["Format Background"] }],
  Transitions: [{ group: "Transition to This Slide", tools: ["Fade", "Push"] }, { group: "Timing", tools: ["Duration", "Apply To All"] }],
  Animations: [{ group: "Animation", tools: ["Fly In", "Appear"] }, { group: "Advanced Animation", tools: ["Animation Pane"] }, { group: "Timing", tools: ["Delay"] }],
  "Slide Show": [{ group: "Start Slide Show", tools: ["From Beginning", "From Current Slide"] }, { group: "Set Up", tools: ["Rehearse Timings"] }],
  Review: [{ group: "Proofing", tools: ["Spelling"] }, { group: "Comments", tools: ["New Comment"] }],
  View: [{ group: "Presentation Views", tools: ["Normal", "Slide Sorter"] }, { group: "Show", tools: ["Gridlines"] }],
  "Picture Tools → Format": [{ group: "Adjust", tools: ["Corrections"] }, { group: "Size", tools: ["Crop"] }],
};

function label(step: string) { return step.replace("tab:", "Open ").replace("tool:", "Choose ").replace("option:", "Choose ").replace("select:", "Select the "); }

export function PowerPoint2016Lesson({ childName }: { childName?: string }) {
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [slideCount, setSlideCount] = useState(1);
  const [layout, setLayout] = useState("Title Slide");
  const [picture, setPicture] = useState(false);
  const [pictureSelected, setPictureSelected] = useState(false);
  const [cropped, setCropped] = useState(false);
  const [theme, setTheme] = useState(false);
  const [fade, setFade] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(false);
  const [flyIn, setFlyIn] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(false);
  const [view, setView] = useState<"Normal" | "Slide Sorter" | "Slide Show">("Normal");
  const [menu, setMenu] = useState<string | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [notice, setNotice] = useState("Follow the first step on the mission card.");
  const mission = missions[missionIndex];
  const done = stepIndex === mission.steps.length;

  function interact(id: string) {
    if (stage !== "missions") return;
    if (id.startsWith("tab:")) { setActiveTab(id.slice(4) as Tab); setMenu(null); }
    if (["New Slide", "Layout", "Pictures", "Themes", "Duration", "Delay"].some(tool => id === `tool:${tool}`)) setMenu(id.slice(5));
    if (id === "tool:New Slide") { setSlideCount(Math.max(slideCount, 2)); setLayout("Title and Content"); }
    if (id === "option:Title and Content") { setLayout("Title and Content"); setMenu(null); }
    if (id === "option:Practice picture") { setPicture(true); setPictureSelected(true); setMenu(null); }
    if (id === "select:Picture" && picture) setPictureSelected(true);
    if (id === "tool:Crop" && pictureSelected) setCropped(true);
    if (id === "option:Blue practice theme") { setTheme(true); setMenu(null); }
    if (id === "tool:Fade") setFade(true);
    if (id === "option:1.5 seconds") { setTransitionDuration(true); setMenu(null); }
    if (id === "tool:Fly In" && pictureSelected) setFlyIn(true);
    if (id === "option:1 second") { setAnimationDelay(true); setMenu(null); }
    if (id === "tool:Slide Sorter") setView("Slide Sorter");
    if (id === "tool:Normal") setView("Normal");
    if (id === "tool:From Beginning") setView("Slide Show");
    if (id === "tool:From Current Slide") setView("Slide Show");
    if ((id === "select:Picture" || id === "tool:Crop" || id === "tool:Fly In") && !picture) { setNotice("Insert the practice picture before using this command."); return; }
    if (id === mission.steps[stepIndex]) {
      const next = stepIndex + 1;
      setStepIndex(next);
      setNotice(next === mission.steps.length ? "Practice complete. Answer the quick check." : `Next: ${label(mission.steps[next])}.`);
    } else if (!done) setNotice(`Try this step: ${label(mission.steps[stepIndex])}.`);
  }

  function nextMission() {
    setAnswer(null); setShowHint(false); setStepIndex(0); setMenu(null);
    if (missionIndex === missions.length - 1) setStage("challenge");
    else { setMissionIndex(missionIndex + 1); setNotice("Follow the first step on the mission card."); }
  }

  function nextChallenge() {
    if (challengeAnswer === null) return;
    setScore(score + Number(challengeAnswer === finalChecks[challengeIndex].answer));
    setChallengeAnswer(null);
    if (challengeIndex === finalChecks.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setMissionIndex(0); setStepIndex(0); setStage("missions"); setActiveTab("Home"); setSlideCount(1); setLayout("Title Slide");
    setPicture(false); setPictureSelected(false); setCropped(false); setTheme(false); setFade(false); setTransitionDuration(false);
    setFlyIn(false); setAnimationDelay(false); setView("Normal"); setMenu(null); setAnswer(null); setChallengeIndex(0);
    setChallengeAnswer(null); setScore(0); setShowHint(false); setNotice("Follow the first step on the mission card.");
  }

  const progress = stage === "complete" ? 100 : stage === "challenge" ? 85 + (challengeIndex / finalChecks.length) * 15 : (missionIndex / missions.length) * 85;

  return <main className={styles.root}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>STUDYCRAFT · GRADE 6 ICSO · COMPUTER STUDIES</p><h1>PowerPoint 2016 Mission Lab</h1><p>Make a small presentation in six short steps, then try questions shaped like recent Olympiad papers.</p><span className={styles.time}>About 27 minutes total · pause after any mission</span></div>
        <div className={styles.heroNumber}><strong>{stage === "complete" ? "✓" : stage === "challenge" ? "?" : `${missionIndex + 1}/6`}</strong><span>{stage === "challenge" ? "final questions" : "short missions"}</span></div>
      </header>
      <div className={styles.progress} aria-label="Lesson progress"><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.grid}>
        <section className={styles.editor} aria-label="PowerPoint 2016 practice editor">
          <div className={styles.titlebar}><span className={styles.dot}>● ● ●</span><strong>My first presentation.pptx</strong><span>Practice editor</span></div>
          <div className={styles.tabs} role="tablist" aria-label="PowerPoint Ribbon tabs">
            {baseTabs.map(tab => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? styles.active : ""} key={tab} onClick={() => interact(`tab:${tab}`)}>{tab}</button>)}
            {pictureSelected && <div className={styles.contextual}><small>PICTURE TOOLS</small><button type="button" role="tab" aria-label="Picture Tools → Format" aria-selected={activeTab === "Picture Tools → Format"} className={activeTab === "Picture Tools → Format" ? styles.active : ""} onClick={() => interact("tab:Picture Tools → Format")}>Format</button></div>}
          </div>
          {activeTab === "File" ? <div className={styles.backstage}><strong>File · Backstage view</strong><p>Open, save, print, and export a presentation here.</p></div> : <div className={styles.ribbon} aria-label={`${activeTab} Ribbon tools`}>
            {commands[activeTab]?.map(group => <div className={styles.group} key={group.group}><div>{group.tools.map(tool => <button type="button" key={tool} onClick={() => interact(`tool:${tool}`)}><span aria-hidden="true">{tool === "New Slide" ? "▣" : tool === "Pictures" ? "▧" : tool === "Fade" ? "◩" : "✦"}</span>{tool}</button>)}</div><small>{group.group}</small></div>)}
          </div>}
          {menu && <div className={styles.menu} role="group" aria-label={`${menu} choices`}><strong>{menu}</strong>{(menu === "Layout" ? ["Title and Content"] : menu === "Pictures" ? ["Practice picture"] : menu === "Themes" ? ["Blue practice theme"] : menu === "Duration" ? ["1.5 seconds"] : menu === "Delay" ? ["1 second"] : []).map(option => <button key={option} type="button" onClick={() => interact(`option:${option}`)}>{option}</button>)}</div>}
          <div className={styles.canvas}>
            {view === "Slide Show" ? <div className={`${styles.showSlide} ${theme ? styles.blueSlide : ""}`}><small>SLIDE SHOW · FROM BEGINNING</small><h2>Our Amazing Planet</h2><p>Press the next mission button to continue learning.</p><button type="button" onClick={() => setView("Normal")}>Exit slide show</button></div> : view === "Slide Sorter" ? <div className={styles.sorter}><p>Slide Sorter · all slides at a glance</p><div>{Array.from({ length: slideCount }, (_, i) => <button type="button" key={i} onClick={() => setView("Normal")}><span>{i + 1}</span><strong>{i === 0 ? "Our Amazing Planet" : "Earth facts"}</strong></button>)}</div></div> : <><aside className={styles.thumbnails}>{Array.from({ length: slideCount }, (_, i) => <div key={i}><small>{i + 1}</small><span>{i === 0 ? "Our Amazing Planet" : "Earth facts"}</span></div>)}</aside><div className={`${styles.slide} ${theme ? styles.blueSlide : ""}`}><p className={styles.slideKicker}>{layout}</p><h2>{slideCount > 1 ? "Earth facts" : "Our Amazing Planet"}</h2><p>Small ideas make a big presentation.</p>{picture && <button type="button" aria-label="Select picture" className={`${styles.picture} ${pictureSelected ? styles.selected : ""} ${cropped ? styles.cropped : ""}`} onClick={() => interact("select:Picture")}><span>🌍</span><small>Practice picture</small></button>}{fade && <span className={styles.effect}>Fade transition{transitionDuration ? " · 1.5 s" : ""}</span>}{flyIn && <span className={styles.effect}>Picture: Fly In{animationDelay ? " · Delay 1 s" : ""}</span>}</div></>}
          </div>
          <div className={styles.statusbar}><span>Slide {slideCount} of {slideCount}</span><span>{view} view</span><span>PowerPoint 2016 practice</span></div>
        </section>
        <aside className={styles.mission}>
          <span className={styles.missionIndex}>MISSION {missionIndex + 1} OF 6 · {mission.time}</span><h2>{mission.title}</h2><p className={styles.concept}>{mission.concept}</p><div className={styles.task}><strong>Your task</strong><p>{mission.task}</p><ol>{mission.steps.map((step, i) => <li key={step} className={i < stepIndex ? styles.stepDone : i === stepIndex ? styles.stepCurrent : ""}>{label(step)}{i < stepIndex ? " ✓" : ""}</li>)}</ol></div><p className={styles.notice} role="status">{notice}</p><button type="button" className={styles.hint} onClick={() => setShowHint(!showHint)}>{showHint ? "Hide hint" : "Need a hint?"}</button>{showHint && <p className={styles.hintText}>{mission.hint}</p>}
          {done && <div className={styles.check}><strong>Quick check</strong><p>{mission.check.question}</p>{mission.check.choices.map((choice, i) => <button type="button" key={choice} aria-pressed={answer === i} className={answer === i ? styles.choiceSelected : ""} onClick={() => setAnswer(i)}>{String.fromCharCode(65 + i)}. {choice}</button>)}{answer !== null && <p className={answer === mission.check.answer ? styles.correct : styles.incorrect}>{answer === mission.check.answer ? "Correct. " : "Try again. "}{mission.check.why}</p>}{answer === mission.check.answer && <button className={styles.primary} type="button" onClick={nextMission}>{missionIndex === missions.length - 1 ? "Start final questions" : "Next mission →"}</button>}</div>}
        </aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><p className={styles.eyebrow}>FINAL CHECK · {challengeIndex + 1} OF {finalChecks.length}</p><h2>Use what you learned</h2><p>{finalChecks[challengeIndex].question}</p>{finalChecks[challengeIndex].choices.map((choice, i) => <button type="button" aria-pressed={challengeAnswer === i} className={challengeAnswer === i ? styles.choiceSelected : ""} key={choice} onClick={() => setChallengeAnswer(i)}>{String.fromCharCode(65 + i)}. {choice}</button>)}{challengeAnswer !== null && <p className={challengeAnswer === finalChecks[challengeIndex].answer ? styles.correct : styles.incorrect}>{challengeAnswer === finalChecks[challengeIndex].answer ? "Correct. " : "The correct answer is " + String.fromCharCode(65 + finalChecks[challengeIndex].answer) + ". "}{finalChecks[challengeIndex].why}</p>}<button type="button" className={styles.primary} disabled={challengeAnswer === null} onClick={nextChallenge}>{challengeIndex === finalChecks.length - 1 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><p className={styles.eyebrow}>MISSION COMPLETE</p><h2>You built and presented a slide deck.</h2><p>You answered {score} of {finalChecks.length} final questions correctly. Review transitions versus animations and try again whenever you like.</p><button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
