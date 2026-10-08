"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import type { FoundationLesson, FoundationQuestion } from "./icso-foundations-data";
import styles from "./icso-foundations-lesson.module.css";

function Answers({ question, choice, onChoose }: { question: FoundationQuestion; choice: number | null; onChoose: (index: number) => void }) {
  return <div className={styles.answers}>{question.options.map((option, index) => <button type="button" key={option} aria-label={`${String.fromCharCode(65 + index)}. ${option}`} aria-pressed={choice === index} disabled={choice !== null} className={choice === index ? styles.chosen : ""} onClick={() => onChoose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>;
}

export function IcsoFoundationsLesson({ lesson, childName }: { lesson: FoundationLesson; childName?: string }) {
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [missionIndex, setMissionIndex] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [checkChoice, setCheckChoice] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [practiceMisses, setPracticeMisses] = useState<number[]>([]);
  const [finalMisses, setFinalMisses] = useState<number[]>([]);
  const [powerOff, setPowerOff] = useState(false);
  const [ramCleared, setRamCleared] = useState(false);
  const [tapePosition, setTapePosition] = useState(0);
  const [directOpened, setDirectOpened] = useState(false);
  const [revealedGeneration, setRevealedGeneration] = useState<number | null>(null);
  const mission = lesson.missions[missionIndex];
  const currentCase = mission.cases[caseIndex];
  const casesDone = caseIndex >= mission.cases.length;
  const correctCase = !casesDone && chosen === currentCase.answer;
  const totalMinutes = lesson.missions.reduce((sum, item) => sum + item.minutes, 6);
  const progress = stage === "complete" ? 100 : stage === "challenge" ? 84 + 16 * challengeIndex / lesson.challenge.length : 84 * (missionIndex + caseIndex / (mission.cases.length + 1)) / lesson.missions.length;

  function markMiss() {
    setPracticeMisses(previous => previous.includes(missionIndex) ? previous : [...previous, missionIndex]);
  }

  function chooseBin(index: number) {
    if (casesDone) return;
    if (index !== currentCase.answer) markMiss();
    setChosen(index);
  }

  function nextCase() {
    if (!correctCase) return;
    setCaseIndex(caseIndex + 1);
    setChosen(null);
  }

  function chooseCheck(index: number) {
    if (checkChoice !== null) return;
    if (index !== mission.check.answer) markMiss();
    setCheckChoice(index);
  }

  function nextMission() {
    if (!casesDone || checkChoice === null) return;
    setCheckChoice(null); setChosen(null); setCaseIndex(0); setPowerOff(false); setRamCleared(false); setTapePosition(0); setDirectOpened(false); setRevealedGeneration(null);
    if (missionIndex === lesson.missions.length - 1) setStage("challenge");
    else setMissionIndex(missionIndex + 1);
  }

  function nextChallenge() {
    if (challengeChoice === null) return;
    const correct = challengeChoice === lesson.challenge[challengeIndex].answer;
    if (!correct) setFinalMisses(previous => [...previous, challengeIndex]);
    setScore(previous => previous + Number(correct));
    setChallengeChoice(null);
    if (challengeIndex === lesson.challenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setStage("missions"); setMissionIndex(0); setCaseIndex(0); setChosen(null); setCheckChoice(null);
    setChallengeIndex(0); setChallengeChoice(null); setScore(0); setPracticeMisses([]); setFinalMisses([]);
    setPowerOff(false); setRamCleared(false); setTapePosition(0); setDirectOpened(false); setRevealedGeneration(null);
  }

  return <main className={`${styles.root} ${lesson.theme === "memory" ? styles.memory : lesson.theme === "history" ? styles.history : ""}`}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}><div><p className={styles.eyebrow}>GRADE 6 ICSO · INTERACTIVE LESSON</p><h1>{lesson.title}</h1><p>{lesson.subtitle}</p><span>Six short parts · about {totalMinutes} minutes total</span></div><strong aria-hidden="true">{lesson.theme === "memory" ? "💾" : lesson.theme === "history" ? "🕰️" : "⌨️"}</strong></header>
      <div className={styles.progress} role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.layout}>
        <section className={styles.workbench} aria-label="Sorting workbench">
          <div className={styles.workbenchHeader}><span>PART {missionIndex + 1} OF 6</span><strong>{mission.title}</strong></div>
          {mission.demo === "power" && <div className={styles.demo}><div><strong>Power-off model</strong><p>Try the switch, then decide where each item belongs.</p></div><button type="button" onClick={() => { if (!powerOff) setRamCleared(true); setPowerOff(!powerOff); }} aria-pressed={powerOff}>{powerOff ? "Turn power on" : "Turn power off"}</button><div className={styles.demoCells}><span>RAM: {powerOff || ramCleared ? "empty" : "unsaved edit"}</span><span>ROM: startup code</span><span>SSD: saved photo</span></div><small>Simulated example; save work before shutting down.</small></div>}
          {mission.demo === "access" && <div className={styles.demo}><div><strong>Find item 4</strong><p>Try both ways of reaching a stored item.</p></div><div className={styles.demoActions}><button type="button" onClick={() => setTapePosition(Math.min(4, tapePosition + 1))}>Read next tape item</button><button type="button" onClick={() => setDirectOpened(true)}>Open item 4 on drive</button></div><div className={styles.demoCells}><span>Tape position: {tapePosition} / 4</span><span>Direct drive: {directOpened ? "item 4 opened" : "ready"}</span></div></div>}
          {mission.demo === "timeline" && <div className={styles.demo}><div><strong>Explore the generation map</strong><p>Choose a stage to reveal its school-level technology label.</p></div><div className={styles.timeline}>{["1st", "2nd", "3rd", "4th", "5th"].map((label, index) => <button key={label} type="button" aria-label={`Show ${label} generation`} aria-pressed={revealedGeneration === index} onClick={() => setRevealedGeneration(index)}>{label}</button>)}</div><p className={styles.timelineResult}>{revealedGeneration === null ? "Tap a stage to begin." : ["Vacuum tubes", "Transistors", "Integrated circuits", "Microprocessors", "AI research and advanced computing"][revealedGeneration]}</p><small>These classroom labels overlap in real history; newer technologies do not erase older ones.</small></div>}
          <div className={styles.boardIntro}><span>CLICK THE CORRECT PLACE</span><p>{mission.idea}</p></div>
          <div className={styles.bins}>{mission.bins.map((bin, index) => <button type="button" key={bin} disabled={casesDone} aria-label={`Place in ${bin}`} aria-pressed={chosen === index} className={`${styles.bin} ${chosen === index ? styles.selectedBin : ""}`} onClick={() => chooseBin(index)}><strong>{bin}</strong><span>{mission.cases.slice(0, caseIndex).filter(item => item.answer === index).map(item => <small key={item.item}>{item.item}</small>)}{correctCase && currentCase.answer === index && <small>{currentCase.item}</small>}</span></button>)}</div>
          {!casesDone ? <div className={styles.caseCard}><span className={styles.kicker}>ITEM {caseIndex + 1} OF {mission.cases.length}</span><strong>{currentCase.item}</strong><h2>{currentCase.prompt}</h2>{chosen !== null && <p className={`${styles.feedback} ${correctCase ? styles.good : styles.tryAgain}`} role="status">{correctCase ? currentCase.explanation : currentCase.wrong?.[chosen] ?? `Think about the role of this item. ${mission.idea}`}</p>}<button type="button" className={styles.primary} disabled={!correctCase} onClick={nextCase}>{caseIndex === mission.cases.length - 1 ? "Answer the quick check →" : "Place next item →"}</button></div> : <div className={styles.caseCard}><span className={styles.kicker}>SORT COMPLETE</span><h2>Now answer the check from memory.</h2><p>Three items placed. Your first answer to the check is the one recorded for review.</p></div>}
          {mission.note && <p className={styles.note}>{mission.note}</p>}
          <div className={styles.source}>{lesson.sourceNote}</div>
        </section>
        <aside className={styles.mission}><span className={styles.kicker}>MISSION {missionIndex + 1} OF 6 · ABOUT {mission.minutes} MIN</span><h2>{mission.title}</h2><p>{mission.idea}</p><ol>{mission.cases.map((item, index) => <li key={item.item} className={index < caseIndex ? styles.done : index === caseIndex ? styles.current : ""}>{item.item}</li>)}</ol>{casesDone && <div className={styles.quickCheck}><span className={styles.kicker}>QUICK CHECK</span><h3>{mission.check.prompt}</h3><Answers question={mission.check} choice={checkChoice} onChoose={chooseCheck} />{checkChoice !== null && <p className={`${styles.feedback} ${checkChoice === mission.check.answer ? styles.good : styles.tryAgain}`}>{checkChoice === mission.check.answer ? "Correct. " : "Revisit this idea. "}{mission.check.explanation}</p>}<button type="button" className={styles.primary} disabled={checkChoice === null} onClick={nextMission}>{missionIndex === lesson.missions.length - 1 ? "Start final challenge" : "Next part →"}</button></div>}</aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><span className={styles.kicker}>FINAL CHALLENGE · ABOUT 6 MIN · QUESTION {challengeIndex + 1} OF {lesson.challenge.length}</span><h2>Use what you learned</h2><p>{lesson.challenge[challengeIndex].prompt}</p><Answers question={lesson.challenge[challengeIndex]} choice={challengeChoice} onChoose={setChallengeChoice} />{challengeChoice !== null && <p className={`${styles.feedback} ${challengeChoice === lesson.challenge[challengeIndex].answer ? styles.good : styles.tryAgain}`}>{challengeChoice === lesson.challenge[challengeIndex].answer ? "Correct. " : `The answer is ${String.fromCharCode(65 + lesson.challenge[challengeIndex].answer)}. `}{lesson.challenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primary} disabled={challengeChoice === null} onClick={nextChallenge}>{challengeIndex === lesson.challenge.length - 1 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><span className={styles.kicker}>LESSON COMPLETE</span><h2>{lesson.theme === "memory" ? "You explored memory and storage." : lesson.theme === "history" ? "You explored computing history." : "You explored computer fundamentals."}</h2><p>You answered {score} of {lesson.challenge.length} final questions correctly. This lesson covered core ideas from the chapter.</p>{(practiceMisses.length > 0 || finalMisses.length > 0) ? <div className={styles.review}><h3>Your next practice</h3>{practiceMisses.slice(0, 2).map(index => <p key={`mission-${index}`}><strong>{lesson.missions[index].title}:</strong> {lesson.missions[index].idea}</p>)}{finalMisses.slice(0, 2).map(index => <p key={`final-${index}`}><strong>Question to revisit:</strong> {lesson.challenge[index].prompt}<br />{lesson.challenge[index].explanation}</p>)}</div> : <p>Try explaining one idea to someone else without looking at the page.</p>}<button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
