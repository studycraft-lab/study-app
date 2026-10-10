"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import { latestItChallenge, latestItMissions, type LatestQuestion } from "./icso-latest-it-data";
import styles from "./icso-latest-it-lesson.module.css";

function Answers({ question, choice, onChoose }: { question: LatestQuestion; choice: number | null; onChoose: (index: number) => void }) {
  return <div className={styles.answers}>{question.options.map((option, index) => <button type="button" key={option} aria-label={`${String.fromCharCode(65 + index)}. ${option}`} aria-pressed={choice === index} disabled={choice !== null} onClick={() => onChoose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>;
}

export function IcsoLatestItLesson({ childName }: { childName?: string }) {
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [missionIndex, setMissionIndex] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [binChoice, setBinChoice] = useState<number | null>(null);
  const [demoOpen, setDemoOpen] = useState<number | null>(null);
  const [checkChoice, setCheckChoice] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [practiceMisses, setPracticeMisses] = useState<number[]>([]);
  const [finalMisses, setFinalMisses] = useState<number[]>([]);
  const mission = latestItMissions[missionIndex];
  const casesDone = caseIndex >= mission.cases.length;
  const currentCase = mission.cases[mission.order[caseIndex]];
  const correctCase = !casesDone && binChoice === currentCase.answer;
  const minutes = latestItMissions.reduce((total, item) => total + item.minutes, 6);
  const progress = stage === "complete" ? 100 : stage === "challenge" ? 84 + 16 * challengeIndex / latestItChallenge.length : 84 * (missionIndex + caseIndex / (mission.cases.length + 1)) / latestItMissions.length;

  function markPracticeMiss() {
    setPracticeMisses(previous => previous.includes(missionIndex) ? previous : [...previous, missionIndex]);
  }

  function chooseBin(index: number) {
    if (casesDone || correctCase) return;
    if (index !== currentCase.answer) markPracticeMiss();
    setBinChoice(index);
  }

  function nextCase() {
    if (!correctCase) return;
    setCaseIndex(caseIndex + 1);
    setBinChoice(null);
  }

  function chooseCheck(index: number) {
    if (checkChoice !== null) return;
    if (index !== mission.check.answer) markPracticeMiss();
    setCheckChoice(index);
  }

  function nextMission() {
    if (!casesDone || checkChoice === null) return;
    setCaseIndex(0); setBinChoice(null); setDemoOpen(null); setCheckChoice(null);
    if (missionIndex === latestItMissions.length - 1) setStage("challenge");
    else setMissionIndex(missionIndex + 1);
  }

  function nextChallenge() {
    if (challengeChoice === null) return;
    const correct = challengeChoice === latestItChallenge[challengeIndex].answer;
    if (!correct) setFinalMisses(previous => [...previous, challengeIndex]);
    setScore(previous => previous + Number(correct));
    setChallengeChoice(null);
    if (challengeIndex === latestItChallenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setStage("missions"); setMissionIndex(0); setCaseIndex(0); setBinChoice(null); setDemoOpen(null); setCheckChoice(null);
    setChallengeIndex(0); setChallengeChoice(null); setScore(0); setPracticeMisses([]); setFinalMisses([]);
  }

  return <main className={styles.root}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}><div><p>GRADE 6 ICSO · INTERACTIVE LESSON</p><h1>IT Update Lab</h1><span>Six short parts · about {minutes} minutes</span><span>Current facts checked 10 Oct 2026</span></div><strong aria-hidden="true">↗</strong></header>
      <div className={styles.progress} role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.layout}>
        <section className={styles.lab} aria-label="IT update practice desk">
          <div className={styles.labHeader}><span>PART {missionIndex + 1} OF 6</span><strong>{mission.title}</strong></div>
          <div className={styles.demo}><span className={styles.kicker}>TAP TO EXPLORE</span><p>Open a card, then use what you learned to classify the clues.</p><div className={styles.demoCards}>{mission.demo.map((card, index) => <button type="button" key={card.front} aria-label={`Explore ${card.front}`} aria-expanded={demoOpen === index} onClick={() => setDemoOpen(demoOpen === index ? null : index)}><strong>{card.front}</strong><span>{demoOpen === index ? card.back : "Tap to reveal →"}</span></button>)}</div></div>
          <div className={styles.practice}><span className={styles.kicker}>CLASSIFY THE CLUE · {Math.min(caseIndex + 1, mission.cases.length)} OF {mission.cases.length}</span>{!casesDone ? <><h2>{currentCase.clue}</h2><p>{currentCase.prompt}</p><div className={styles.bins}>{mission.bins.map((bin, index) => <button type="button" key={bin} aria-label={`Choose ${bin}`} aria-pressed={binChoice === index} disabled={correctCase} onClick={() => chooseBin(index)}>{bin}</button>)}</div>{binChoice !== null && <p className={`${styles.feedback} ${correctCase ? styles.good : styles.tryAgain}`} role="status">{correctCase ? currentCase.explanation : currentCase.wrong[binChoice] ?? "Look at the clue again and try another category."}</p>}<button type="button" className={styles.primary} disabled={!correctCase} onClick={nextCase}>{caseIndex === mission.cases.length - 1 ? "Try the memory check →" : "Next clue →"}</button></> : <><h2>Three clues classified.</h2><p>Now answer the check from memory. Your first choice is recorded for review.</p></>}</div>
          <p className={styles.note}>{mission.note}</p>
        </section>
        <aside className={styles.guide}><span className={styles.kicker}>MISSION {missionIndex + 1} OF 6 · ABOUT {mission.minutes} MIN</span><h2>{mission.title}</h2><p>{mission.idea}</p><ol>{mission.order.map((caseNumber, index) => <li key={mission.cases[caseNumber].clue} className={index < caseIndex ? styles.done : index === caseIndex ? styles.current : ""}>{mission.cases[caseNumber].clue}</li>)}</ol>{casesDone && <div className={styles.check}><span className={styles.kicker}>MEMORY CHECK</span><h3>{mission.check.prompt}</h3><Answers question={mission.check} choice={checkChoice} onChoose={chooseCheck} />{checkChoice !== null && <p className={`${styles.feedback} ${checkChoice === mission.check.answer ? styles.good : styles.tryAgain}`}>{checkChoice === mission.check.answer ? "Correct. " : "Revisit this idea. "}{mission.check.explanation}</p>}<button type="button" className={styles.primary} disabled={checkChoice === null} onClick={nextMission}>{missionIndex === 5 ? "Start final challenge" : "Next part →"}</button></div>}</aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><span className={styles.kicker}>FINAL CHALLENGE · ABOUT 6 MIN · QUESTION {challengeIndex + 1} OF 6</span><h2>Spot the important clue</h2><p>{latestItChallenge[challengeIndex].prompt}</p><Answers question={latestItChallenge[challengeIndex]} choice={challengeChoice} onChoose={setChallengeChoice} />{challengeChoice !== null && <p className={`${styles.feedback} ${challengeChoice === latestItChallenge[challengeIndex].answer ? styles.good : styles.tryAgain}`}>{challengeChoice === latestItChallenge[challengeIndex].answer ? "Correct. " : `The answer is ${String.fromCharCode(65 + latestItChallenge[challengeIndex].answer)}. `}{latestItChallenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primary} disabled={challengeChoice === null} onClick={nextChallenge}>{challengeIndex === 5 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><span className={styles.kicker}>LESSON COMPLETE</span><h2>You can read IT news more carefully.</h2><p>You answered {score} of 6 final questions correctly. Current version numbers were checked on 10 October 2026 and may change later.</p>{(practiceMisses.length > 0 || finalMisses.length > 0) && <div className={styles.review}><h3>What to revisit</h3>{practiceMisses.slice(0, 2).map(index => <p key={`mission-${index}`}><strong>{latestItMissions[index].title}:</strong> {latestItMissions[index].idea}</p>)}{finalMisses.slice(0, 2).map(index => <p key={`final-${index}`}><strong>Challenge clue:</strong> {latestItChallenge[index].explanation}</p>)}</div>}<button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
