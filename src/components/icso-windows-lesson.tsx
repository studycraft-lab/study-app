"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import { windowsChallenge, windowsMissions, type WindowsQuestion } from "./icso-windows-data";
import styles from "./icso-windows-lesson.module.css";

function Answers({ question, choice, onChoose }: { question: WindowsQuestion; choice: number | null; onChoose: (index: number) => void }) {
  return <div className={styles.answers}>{question.options.map((option, index) => <button type="button" key={option} aria-label={`${String.fromCharCode(65 + index)}. ${option}`} disabled={choice !== null} aria-pressed={choice === index} onClick={() => onChoose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>;
}

export function IcsoWindowsLesson({ childName }: { childName?: string }) {
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const [checkChoice, setCheckChoice] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<number[]>([]);
  const mission = windowsMissions[missionIndex];
  const stepsDone = stepIndex === mission.steps.length;
  const progress = stage === "complete" ? 100 : stage === "challenge" ? 84 + 16 * challengeIndex / windowsChallenge.length : 84 * (missionIndex + stepIndex / (mission.steps.length + 1)) / windowsMissions.length;

  function act(action: string) {
    if (stepsDone) return;
    const expected = mission.steps[stepIndex];
    if (action !== expected.action) { setNotice("Try the highlighted action for this step."); return; }
    setStepIndex(stepIndex + 1);
    setNotice(expected.result);
  }

  function chooseCheck(choice: number) {
    if (checkChoice !== null) return;
    setCheckChoice(choice);
    if (choice !== mission.check.answer) setMisses(previous => previous.includes(missionIndex) ? previous : [...previous, missionIndex]);
  }

  function nextMission() {
    if (checkChoice === null || !stepsDone) return;
    setStepIndex(0); setCheckChoice(null); setNotice("");
    if (missionIndex === windowsMissions.length - 1) setStage("challenge");
    else setMissionIndex(missionIndex + 1);
  }

  function nextChallenge() {
    if (challengeChoice === null) return;
    setScore(previous => previous + Number(challengeChoice === windowsChallenge[challengeIndex].answer));
    setChallengeChoice(null);
    if (challengeIndex === windowsChallenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setStage("missions"); setMissionIndex(0); setStepIndex(0); setNotice(""); setCheckChoice(null);
    setChallengeIndex(0); setChallengeChoice(null); setScore(0); setMisses([]);
  }

  const control = (action: string, label: string, className = "") => <button type="button" className={`${styles.control} ${className} ${!stepsDone && mission.steps[stepIndex].action === action ? styles.target : ""}`} onClick={() => act(action)}>{label}</button>;

  return <main className={styles.root}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}><div><p>GRADE 6 ICSO · INTERACTIVE LESSON</p><h1>Windows 11 Practice Desktop</h1><span>Six short parts · about 29 minutes total</span></div><strong aria-hidden="true">⊞</strong></header>
      <div className={styles.progress} role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.layout}>
        <section className={styles.simulator} aria-label="Simulated Windows 11 desktop">
          <div className={styles.simHeader}><span>PART {missionIndex + 1} OF 6</span><strong>{mission.title}</strong></div>
          <div className={styles.desktop}>
            <p className={styles.simLabel}>Practice model of Windows 11 · choose the highlighted control</p>
            {missionIndex === 0 && <div className={styles.panel}><h3>Start</h3>{stepIndex >= 1 && <><p>Pinned apps · Recommended · Search</p>{control("start:search", "Search apps and files")}</>}{stepIndex >= 2 && <div className={styles.innerPanel}><p>Search results</p>{control("search:explorer", "File Explorer")}</div>}{stepIndex >= 3 && <div className={styles.innerPanel}>📁 File Explorer · Home</div>}</div>}
            {missionIndex === 1 && <div className={styles.window}><div className={styles.windowBar}><span>Study page</span>{control("window:maximize", "□ Maximize / Snap")}</div><p>A window with a maximize button.</p>{stepIndex >= 1 && <div className={styles.innerPanel}><strong>Snap layouts</strong><div className={styles.layoutChoices}>{control("layout:two", "▣ Two columns")}{control("layout:three", "▥ Three columns")}</div></div>}{stepIndex >= 2 && <div className={styles.innerPanel}><p>Snap Assist · Fill the open side</p>{control("assist:notes", "📝 Notes")}</div>}{stepIndex >= 3 && <div className={styles.snapResult}><span>Study page</span><span>Notes</span></div>}</div>}
            {missionIndex === 2 && stepIndex >= 1 && <div className={styles.panel}><h3>Widgets</h3><p>At-a-glance cards</p>{control("widget:weather", "☀ Weather · 24°C")}{stepIndex >= 2 && <p>Weather card selected.</p>}</div>}
            {missionIndex === 3 && stepIndex >= 1 && <div className={styles.panel}><h3>Task View</h3><p>Your desktops</p><div className={styles.layoutChoices}><span className={styles.tile}>Desktop 1</span>{stepIndex >= 2 && control("desktop:two", "Desktop 2")}{control("desktop:new", "+ New desktop")}</div>{stepIndex >= 3 && <p>Now using Desktop 2.</p>}</div>}
            {missionIndex === 4 && <div className={styles.panel}><h3>Desktop background</h3>{control("desktop:rightclick", "Right-click desktop")}{stepIndex >= 1 && <div className={styles.innerPanel}>{control("menu:personalize", "Personalize")}</div>}{stepIndex >= 2 && <div className={styles.innerPanel}><strong>Settings · Personalization</strong><p>{control("settings:background", "Background")}</p>{stepIndex >= 3 && <><p>Choose your background</p>{control("background:solid", "Solid color")}</>}{stepIndex >= 4 && <p>Solid color selected.</p>}</div>}</div>}
            {missionIndex === 5 && <div className={styles.panel}><h3>Shortcut keyboard</h3><p>Tap each pair in order. These buttons simulate shortcuts; they do not change your computer.</p><div className={styles.layoutChoices}>{control("shortcut:e", "⊞ Win + E")}{control("shortcut:i", "⊞ Win + I")}{control("shortcut:d", "⊞ Win + D")}</div>{stepIndex > 0 && <p>{stepIndex === 1 ? "File Explorer opened." : stepIndex === 2 ? "Settings opened." : "Desktop shown."}</p>}</div>}
            <div className={styles.taskbar}>{control("taskbar:widgets", "☀ Widgets")}<div>{control("taskbar:start", "⊞ Start")}{control("taskbar:taskview", "▣ Task View")}<span>📁</span></div><span>◉ 10:30</span></div>
          </div>
          <p className={styles.notice} role="status">{notice || "Choose the highlighted control to begin."}</p>
          <p className={styles.source}>Original practice based on the Grade 6 ICSO synopsis and recent paper patterns. This is a teaching model; your Windows screen may look different.</p>
        </section>
        <aside className={styles.guide}><span className={styles.kicker}>MISSION {missionIndex + 1} OF 6 · ABOUT {mission.minutes} MIN</span><h2>{mission.title}</h2><p>{mission.idea}</p><ol>{mission.steps.map((step, index) => <li key={step.action} className={index < stepIndex ? styles.done : index === stepIndex ? styles.current : ""}>{step.label}</li>)}</ol>{stepsDone && <div className={styles.check}><span className={styles.kicker}>QUICK CHECK</span><h3>{mission.check.prompt}</h3><Answers question={mission.check} choice={checkChoice} onChoose={chooseCheck} />{checkChoice !== null && <p className={styles.feedback}>{checkChoice === mission.check.answer ? "Correct. " : "Review this idea. "}{mission.check.explanation}</p>}<button type="button" className={styles.primary} disabled={checkChoice === null} onClick={nextMission}>{missionIndex === 5 ? "Start final challenge" : "Next part →"}</button></div>}</aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><span className={styles.kicker}>FINAL CHALLENGE · ABOUT 6 MIN · QUESTION {challengeIndex + 1} OF 6</span><h2>Use what you learned</h2><p>{windowsChallenge[challengeIndex].prompt}</p><Answers question={windowsChallenge[challengeIndex]} choice={challengeChoice} onChoose={setChallengeChoice} />{challengeChoice !== null && <p className={styles.feedback}>{challengeChoice === windowsChallenge[challengeIndex].answer ? "Correct. " : `The answer is ${String.fromCharCode(65 + windowsChallenge[challengeIndex].answer)}. `}{windowsChallenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primary} disabled={challengeChoice === null} onClick={nextChallenge}>{challengeIndex === 5 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><span className={styles.kicker}>LESSON COMPLETE</span><h2>You navigated Windows 11.</h2><p>You answered {score} of 6 final questions correctly.</p>{misses.length > 0 && <div className={styles.review}><h3>Practise these paths again</h3>{misses.slice(0, 3).map(index => <p key={index}><strong>{windowsMissions[index].title}:</strong> {windowsMissions[index].idea}</p>)}</div>}<button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
