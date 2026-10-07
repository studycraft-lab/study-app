"use client";

import { useState } from "react";
import { AppHeader } from "./app-header";
import type { IcsoLesson, IcsoMission, IcsoQuestion } from "./icso-concept-lessons";
import styles from "./icso-concept-lesson.module.css";

function TopologyGlyph({ index }: { index: number }) {
  if (index === 0) return <svg viewBox="0 0 90 66" aria-hidden="true"><path d="M45 33 16 12M45 33 74 12M45 33 16 54M45 33 74 54" /><circle cx="45" cy="33" r="7" /><circle cx="16" cy="12" r="5" /><circle cx="74" cy="12" r="5" /><circle cx="16" cy="54" r="5" /><circle cx="74" cy="54" r="5" /></svg>;
  if (index === 1) return <svg viewBox="0 0 90 66" aria-hidden="true"><path d="M9 33H81M19 33V14M45 33V14M71 33V14M19 33V52M45 33V52M71 33V52" /><circle cx="19" cy="13" r="4" /><circle cx="45" cy="13" r="4" /><circle cx="71" cy="13" r="4" /><circle cx="19" cy="53" r="4" /><circle cx="45" cy="53" r="4" /><circle cx="71" cy="53" r="4" /></svg>;
  return <svg viewBox="0 0 90 66" aria-hidden="true"><path d="M45 9 75 33 45 57 15 33Z" /><circle cx="45" cy="9" r="5" /><circle cx="75" cy="33" r="5" /><circle cx="45" cy="57" r="5" /><circle cx="15" cy="33" r="5" /></svg>;
}

function Scene({ mission, stepIndex, picked, onChoose }: { mission: IcsoMission; stepIndex: number; picked: number | null; onChoose: (index: number) => void }) {
  const { scene } = mission;
  return <div className={styles.scene} aria-label={scene.title}>
    <div className={styles.sceneTop}><span>{scene.kind === "path" ? "VISUAL MODEL" : "CLICK THE DIAGRAM"}</span><strong>{scene.title}</strong></div>
    <div className={`${styles.sceneNodes} ${styles[scene.kind] ?? ""}`}>
      {scene.nodes.map((node, index) => {
        const choice = scene.kind !== "path" && stepIndex < mission.steps.length ? mission.steps[stepIndex].options.findIndex(option => node.toLowerCase().includes(option.toLowerCase())) : -1;
        const className = `${styles.sceneNode} ${index <= stepIndex ? styles.sceneActive : ""} ${choice === picked ? styles.sceneSelected : ""}`;
        const content = <>{scene.kind === "topology" && <TopologyGlyph index={index} />}<span>{node}</span></>;
        return choice >= 0 ? <button key={node} type="button" className={className} aria-label={`Choose ${node}`} aria-pressed={picked === choice} onClick={() => onChoose(choice)}>{content}</button> : <div key={node} className={className}>{content}</div>;
      })}
    </div>
    <p>{scene.caption}</p>
  </div>;
}

function Answers({ question, choice, onChoose, locked = false }: { question: IcsoQuestion; choice: number | null; onChoose: (index: number) => void; locked?: boolean }) {
  return <div className={styles.answers}>
    {question.options.map((option, index) => <button key={option} type="button" aria-label={`${String.fromCharCode(65 + index)}. ${option}`} aria-pressed={choice === index} disabled={locked && choice !== null} className={choice === index ? styles.selectedAnswer : ""} onClick={() => onChoose(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
  </div>;
}

export function IcsoConceptLesson({ lesson, childName }: { lesson: IcsoLesson; childName?: string }) {
  const [stage, setStage] = useState<"missions" | "challenge" | "complete">("missions");
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checkChoice, setCheckChoice] = useState<number | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [practiceMisses, setPracticeMisses] = useState<number[]>([]);
  const [finalMisses, setFinalMisses] = useState<number[]>([]);
  const mission = lesson.missions[missionIndex];
  const step = mission.steps[stepIndex];
  const activityDone = stepIndex >= mission.steps.length;
  const correctStep = !activityDone && picked === step.answer;
  const correctCheck = checkChoice === mission.check.answer;
  const totalMinutes = lesson.missions.reduce((sum, item) => sum + item.minutes, 6);
  const progress = stage === "complete" ? 100 : stage === "challenge" ? 84 + 16 * challengeIndex / lesson.challenge.length : 84 * (missionIndex + stepIndex / (mission.steps.length + 1)) / lesson.missions.length;

  function rememberPracticeMiss() {
    setPracticeMisses(previous => previous.includes(missionIndex) ? previous : [...previous, missionIndex]);
  }

  function choosePractice(index: number) {
    if (index !== step.answer) rememberPracticeMiss();
    setPicked(index);
  }

  function chooseCheck(index: number) {
    if (checkChoice !== null) return;
    if (index !== mission.check.answer) rememberPracticeMiss();
    setCheckChoice(index);
  }

  function nextStep() {
    if (!correctStep) return;
    setPicked(null);
    setStepIndex(stepIndex + 1);
  }

  function nextMission() {
    if (!activityDone || checkChoice === null) return;
    setCheckChoice(null);
    setPicked(null);
    setStepIndex(0);
    if (missionIndex === lesson.missions.length - 1) setStage("challenge");
    else setMissionIndex(missionIndex + 1);
  }

  function nextChallenge() {
    if (challengeChoice === null) return;
    if (challengeChoice !== lesson.challenge[challengeIndex].answer) setFinalMisses(previous => [...previous, challengeIndex]);
    setScore(score + Number(challengeChoice === lesson.challenge[challengeIndex].answer));
    setChallengeChoice(null);
    if (challengeIndex === lesson.challenge.length - 1) setStage("complete");
    else setChallengeIndex(challengeIndex + 1);
  }

  function restart() {
    setStage("missions"); setMissionIndex(0); setStepIndex(0); setPicked(null); setCheckChoice(null);
    setChallengeIndex(0); setChallengeChoice(null); setScore(0); setPracticeMisses([]); setFinalMisses([]);
  }

  return <main className={`${styles.root} ${lesson.theme === "ai" ? styles.ai : ""}`}>
    <AppHeader role="child" childName={childName} />
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>GRADE 6 ICSO · INTERACTIVE LESSON</p><h1>{lesson.title}</h1><p>{lesson.subtitle}</p><span>Six short parts · about {totalMinutes} minutes total</span></div>
        <div className={styles.heroBadge} aria-hidden="true">{lesson.theme === "ai" ? "🤖" : "🌐"}</div>
      </header>
      <div className={styles.progress} role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
      {stage === "missions" && <div className={styles.layout}>
        <section className={styles.workbench} aria-label="Interactive practice workbench">
          <div className={styles.workbenchHeader}><span>EXPLORE · PART {missionIndex + 1} OF {lesson.missions.length}</span><strong>{mission.title}</strong></div>
          <Scene mission={mission} stepIndex={stepIndex} picked={picked} onChoose={choosePractice} />
          {!activityDone ? <div className={styles.activity}>
            <span className={styles.kicker}>CLICK TO TRY · ACTION {stepIndex + 1} OF {mission.steps.length}</span>
            <h2>{step.prompt}</h2>
            <div className={styles.actionCards}>{step.options.map((option, index) => <button key={option} type="button" aria-label={`${String.fromCharCode(65 + index)}. ${option}`} aria-pressed={picked === index} className={picked === index ? styles.picked : ""} onClick={() => choosePractice(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
            {picked !== null && <p className={`${styles.feedback} ${correctStep ? styles.good : styles.tryAgain}`} role="status">{correctStep ? step.result : step.wrongFeedback?.[picked] ?? step.hint}</p>}
            <button type="button" className={styles.primary} disabled={!correctStep} onClick={nextStep}>{stepIndex === mission.steps.length - 1 ? "Answer the quick check →" : "Next action →"}</button>
          </div> : <div className={styles.activity}><span className={styles.kicker}>MODEL COMPLETE</span><h2>Now check the idea beside the model.</h2><p className={styles.finished}>You completed {mission.steps.length} actions. Use the quick check to finish this part.</p></div>}
          <div className={styles.workbenchFooter}>{lesson.sourceNote}</div>
        </section>
        <aside className={styles.mission}>
          <span className={styles.kicker}>MISSION {missionIndex + 1} OF {lesson.missions.length} · ABOUT {mission.minutes} MIN</span>
          <h2>{mission.title}</h2><p>{mission.idea}</p>
          <div className={styles.stepList}><strong>Small actions</strong>{mission.steps.map((item, index) => <div key={item.prompt} className={index < stepIndex ? styles.doneStep : index === stepIndex ? styles.currentStep : ""}><span>{index < stepIndex ? "✓" : index + 1}</span>{item.prompt}</div>)}</div>
          {activityDone && <div className={styles.quickCheck}><span className={styles.kicker}>QUICK CHECK</span><h3>{mission.check.prompt}</h3><Answers question={mission.check} choice={checkChoice} onChoose={chooseCheck} locked />{checkChoice !== null && <p className={`${styles.feedback} ${correctCheck ? styles.good : styles.tryAgain}`}>{correctCheck ? "Correct. " : "Let's revisit this idea. "}{mission.check.explanation}</p>}<button type="button" className={styles.primary} disabled={checkChoice === null} onClick={nextMission}>{missionIndex === lesson.missions.length - 1 ? "Start final challenge" : "Next part →"}</button></div>}
        </aside>
      </div>}
      {stage === "challenge" && <section className={styles.challenge}><span className={styles.kicker}>FINAL CHALLENGE · ABOUT 6 MIN · QUESTION {challengeIndex + 1} OF {lesson.challenge.length}</span><h2>Use what you learned</h2><p>{lesson.challenge[challengeIndex].prompt}</p><Answers question={lesson.challenge[challengeIndex]} choice={challengeChoice} onChoose={setChallengeChoice} locked />{challengeChoice !== null && <p className={`${styles.feedback} ${challengeChoice === lesson.challenge[challengeIndex].answer ? styles.good : styles.tryAgain}`}>{challengeChoice === lesson.challenge[challengeIndex].answer ? "Correct. " : "The answer is " + String.fromCharCode(65 + lesson.challenge[challengeIndex].answer) + ". "}{lesson.challenge[challengeIndex].explanation}</p>}<button type="button" className={styles.primary} disabled={challengeChoice === null} onClick={nextChallenge}>{challengeIndex === lesson.challenge.length - 1 ? "See my result" : "Next question →"}</button></section>}
      {stage === "complete" && <section className={styles.challenge}><span className={styles.kicker}>LESSON COMPLETE</span><h2>Nice work exploring {lesson.theme === "ai" ? "AI and robotics" : "networks and online safety"}.</h2><p>You answered {score} of {lesson.challenge.length} final questions correctly. This short lesson covered core ideas from the chapter.</p>{(practiceMisses.length > 0 || finalMisses.length > 0) && <div className={styles.reviewBox}><h3>Your next practice</h3>{practiceMisses.slice(0, 2).map(index => <p key={`mission-${index}`}><strong>{lesson.missions[index].title}:</strong> {lesson.missions[index].idea}</p>)}{finalMisses.slice(0, 2).map(index => <p key={`final-${index}`}><strong>Final question to revisit:</strong> {lesson.challenge[index].prompt}<br />{lesson.challenge[index].explanation}</p>)}</div>}{practiceMisses.length === 0 && finalMisses.length === 0 && <p className={styles.finished}>You answered these checks correctly. Try explaining one idea to someone else without looking at the page.</p>}<button type="button" className={styles.primary} onClick={restart}>Practise again</button></section>}
    </div>
  </main>;
}
