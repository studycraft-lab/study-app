"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LETTER_CASES, type ChoiceQuestion, type LetterCase } from "@/content/english/informal-letter-lesson";
import styles from "@/app/study/english-language/informal-letters/informal-letters.module.css";

type Screen = "home" | "format-learn" | "format-quiz" | "format-rebuild" | "formula" | "cases" | "case" | "paper" | "done";
const WRITER_NAME = "Riya";

const FORMAT_QUESTIONS: ChoiceQuestion[] = [
  {
    prompt: "Choose the exact first line of the address.",
    options: ["26 Sunny Apartments,", "26, Sunny Apartments,", "26, Sunny Apartment,"],
    correct: 1,
    explanation: "Memorise this fixed line: 26, Sunny Apartments,",
  },
  {
    prompt: "Choose the exact last line of the address.",
    options: ["Bangalore- 560018", "Bangalore- 560018.", "Bangalore- 560018,"],
    correct: 1,
    explanation: "Only the second choice ends the same address line with a full stop. The first has no mark; the third has a comma.",
  },
  {
    prompt: "Choose the date in the school's style.",
    options: ["12th September 2026", "12th September, 2026", "12th September, 2026."],
    correct: 2,
    explanation: "There is a comma after the month and a full stop after the year.",
  },
  {
    prompt: "Where does the letter frame need a full empty line?",
    options: ["After every address line", "Only after the greeting", "After the PIN line, date, and conclusion"],
    correct: 2,
    explanation: "Leave one empty line after Bangalore- 560018., after the date, and between the conclusion and With love,",
  },
  {
    prompt: "Choose the greeting for a letter to Mother.",
    options: ["My dear mother,", "My dear Mother,", "Dear mother."],
    correct: 1,
    explanation: "The model greeting uses Mother with a capital M and ends with a comma.",
  },
  {
    prompt: "Choose the first closing line.",
    options: ["With love,", "With Love,", "With love."],
    correct: 0,
    explanation: "The school's line is exactly: With love,",
  },
  {
    prompt: "Choose the second closing line.",
    options: ["Yours affectionatly,", "Yours affectionately,", "Your's affectionately,"],
    correct: 1,
    explanation: "Remember the spelling: affectionately. The line ends with a comma.",
  },
  {
    prompt: "Where do both closing lines begin?",
    options: ["At the same left margin as the greeting", "In the middle of the page", "At the right edge of the page"],
    correct: 0,
    explanation: "Start each closing line at the same left margin as the greeting.",
  },
  {
    prompt: "How should the writer's name end?",
    options: ["With a full stop", "With a comma", "With no punctuation"],
    correct: 2,
    explanation: "Write the name on its own line, with no full stop after it.",
  },
];

const PAPER_CHECKS = [
  "I used the exact Sunny Apartments address and the school's date style.",
  "My greeting names the right person, with the right capital letter and comma.",
  "My introduction connects with the reader and says why I am writing.",
  "Body 1 makes the main event or message clear with useful details.",
  "Body 2 answers anything else asked and adds personal meaning.",
  "My conclusion speaks to this person and ends naturally.",
  "The closing lines and name begin at the left margin.",
  "I spelled affectionately correctly and put no full stop after my name.",
];

function salutation(letterCase: LetterCase) {
  switch (letterCase.id) {
    case "school-award": return "My dear Grandmother,";
    case "birthday-gift": return "My dear Ananya,";
    case "weekend-invitation": return "My dear Kabir,";
    case "chess-win": return "My dear Meera,";
    case "brother-loss": return "My dear Brother,";
    default: return "My dear Rohan,";
  }
}

function FormatSheet({ letterCase, greeting = "My dear Mother," }: { letterCase?: LetterCase; greeting?: string }) {
  return <div className={styles.sheet} aria-label="School informal letter format">
    <div>26, Sunny Apartments,</div>
    <div>Shanti Nagar,</div>
    <div>Bangalore- 560018.</div>
    <div className={styles.blankLine} aria-hidden="true" />
    <div>{letterCase?.date ?? "12th September, 2026."}</div>
    <div className={styles.blankLine} aria-hidden="true" />
    <div>{letterCase ? salutation(letterCase) : greeting}</div>
    {letterCase ? <>
      <p>{letterCase.model.intro}</p>
      <p>{letterCase.model.body1}</p>
      <p>{letterCase.model.body2}</p>
      <p>{letterCase.model.conclusion}</p>
    </> : <>
      <p className={styles.placeholder}>[Introduction]</p>
      <p className={styles.placeholder}>[Body]</p>
      <p className={styles.placeholder}>[Conclusion]</p>
    </>}
    <div className={styles.blankLine} aria-hidden="true" />
    <div>With love,</div>
    <div>Yours affectionately,</div>
    <div>{WRITER_NAME}</div>
  </div>;
}

function ChoiceOptions({ question, selected, onSelect, checked }: {
  question: ChoiceQuestion;
  selected: number | null;
  onSelect: (value: number) => void;
  checked: boolean;
}) {
  return <div className={styles.options} role="group" aria-label={question.prompt}>
    {question.options.map((option, index) => <button
      key={`${option}-${index}`}
      type="button"
      disabled={checked}
      className={`${styles.option} ${selected === index ? styles.selected : ""} ${checked && index === question.correct ? styles.correct : ""} ${checked && selected === index && index !== question.correct ? styles.incorrect : ""}`}
      aria-pressed={selected === index}
      onClick={() => onSelect(index)}
    ><span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}
  </div>;
}

export function InformalLetterExperience({ childId }: { childId: string }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [formatIndex, setFormatIndex] = useState(0);
  const [formatChoice, setFormatChoice] = useState<number | null>(null);
  const [formatChecked, setFormatChecked] = useState(false);
  const [formatCorrectCount, setFormatCorrectCount] = useState(0);
  const [rebuildOrder, setRebuildOrder] = useState<number[]>([]);
  const [rebuildChecked, setRebuildChecked] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [caseStage, setCaseStage] = useState(0);
  const [decodeAnswers, setDecodeAnswers] = useState<(number | null)[]>([null, null, null]);
  const [caseChoice, setCaseChoice] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [caseChecked, setCaseChecked] = useState(false);
  const [promptRead, setPromptRead] = useState(false);
  const [finishedCases, setFinishedCases] = useState<string[]>([]);
  const [paperChecks, setPaperChecks] = useState<boolean[]>(PAPER_CHECKS.map(() => false));
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(`studycraft-informal-letters-v1:${childId}`) ?? "null");
        if (saved && Array.isArray(saved.finishedCases)) {
          setFinishedCases(saved.finishedCases.filter((id: unknown) => typeof id === "string" && LETTER_CASES.some((item) => item.id === id)));
        }
        if (saved && Array.isArray(saved.paperChecks)) {
          setPaperChecks(PAPER_CHECKS.map((_, index) => saved.paperChecks[index] === true));
        }
      } catch { /* Learning continues if browser storage is unavailable. */ }
      setProgressReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [childId]);

  useEffect(() => {
    if (!progressReady) return;
    try {
      window.localStorage.setItem(`studycraft-informal-letters-v1:${childId}`, JSON.stringify({ finishedCases, paperChecks }));
    } catch { /* Learning continues if browser storage is unavailable. */ }
  }, [childId, finishedCases, paperChecks, progressReady]);

  const letterCase = LETTER_CASES[caseIndex];
  const caseStages = ["Read the question", "Connect", "Tell", "Deepen", "Close", "Review", "Read the whole letter"];
  const formatQuestion = FORMAT_QUESTIONS[formatIndex];
  const formatRight = formatChoice === formatQuestion.correct;
  const decodeComplete = decodeAnswers.every((answer) => answer !== null);
  const decodeRight = decodeAnswers.every((answer, index) => answer === letterCase.decode[index].correct);
  const correctCardIds = letterCase.body1.cards.filter((card) => card.correct).map((card) => card.id);
  const cardsRight = selectedCards.length === correctCardIds.length && selectedCards.every((id) => correctCardIds.includes(id));
  const stageQuestion = caseStage === 1 ? letterCase.intro : caseStage === 3 ? letterCase.body2 : caseStage === 4 ? letterCase.conclusion : letterCase.review;
  const caseRight = caseStage === 0 ? decodeRight : caseStage === 2 ? cardsRight : caseChoice === stageQuestion.correct;
  const formatLines = [
    "26, Sunny Apartments,", "Shanti Nagar,", "Bangalore- 560018.",
    "12th September, 2026.", "My dear Mother,", "[Letter paragraphs]",
    "With love,", "Yours affectionately,", WRITER_NAME,
  ];
  const shuffledLines = [4, 7, 1, 5, 0, 8, 3, 6, 2];
  const rebuiltCorrectly = rebuildOrder.length === formatLines.length && rebuildOrder.every((value, index) => value === index);

  function navigate(next: Screen) {
    setScreen(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCase(index: number) {
    setCaseIndex(index);
    setCaseStage(0);
    setDecodeAnswers([null, null, null]);
    setCaseChoice(null);
    setSelectedCards([]);
    setCaseChecked(false);
    setPromptRead(false);
    navigate("case");
  }

  function nextFormatQuestion() {
    if (formatIndex === FORMAT_QUESTIONS.length - 1) {
      navigate("format-rebuild");
      return;
    }
    setFormatIndex((index) => index + 1);
    setFormatChoice(null);
    setFormatChecked(false);
  }

  function checkFormat() {
    if (formatChoice === null || formatChecked) return;
    if (formatRight) setFormatCorrectCount((count) => count + 1);
    setFormatChecked(true);
  }

  function nextCaseStage() {
    if (caseStage === 6) {
      setFinishedCases((existing) => existing.includes(letterCase.id) ? existing : [...existing, letterCase.id]);
      if (caseIndex < LETTER_CASES.length - 1) startCase(caseIndex + 1);
      else navigate("paper");
      return;
    }
    setCaseStage((stage) => stage + 1);
    setCaseChoice(null);
    setSelectedCards([]);
    setCaseChecked(false);
  }

  function checkCase() {
    if (caseStage === 0 && !decodeComplete) return;
    if (caseStage === 2 && selectedCards.length === 0) return;
    if (![0, 2].includes(caseStage) && caseChoice === null) return;
    setCaseChecked(true);
  }

  function reset() {
    setFormatIndex(0);
    setFormatChoice(null);
    setFormatChecked(false);
    setFormatCorrectCount(0);
    setRebuildOrder([]);
    setRebuildChecked(false);
    setFinishedCases([]);
    setPaperChecks(PAPER_CHECKS.map(() => false));
    navigate("home");
  }

  return <main className={styles.root}>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/study"><span className={styles.brandMark}>S</span><span>StudyCraft <small>Informal Letters</small></span></Link>
      <nav className={styles.topnav} aria-label="Lesson sections">
        <Link href="/study">Subjects</Link>
        <button type="button" onClick={() => navigate("home")}>Home</button>
        <button type="button" onClick={() => navigate("format-learn")}>Format</button>
        <button type="button" onClick={() => navigate("formula")}>Formula</button>
        <button type="button" onClick={() => navigate("cases")}>Cases</button>
        <button type="button" onClick={() => navigate("paper")}>Paper task</button>
      </nav>
    </header>

    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sideKicker}>INFORMAL LETTERS</p>
        <h2>Learn it. See it. Use it.</h2>
        <ol className={styles.sideSteps}>
          <li className={screen.startsWith("format") ? styles.activeStep : ""}>Remember the school format</li>
          <li className={screen === "formula" ? styles.activeStep : ""}>Learn the four-part formula</li>
          <li className={["cases", "case"].includes(screen) ? styles.activeStep : ""}>Walk through real letters</li>
          <li className={["paper", "done"].includes(screen) ? styles.activeStep : ""}>Try one on paper</li>
        </ol>
      </aside>

      <section className={styles.content} aria-live="polite">
        {screen === "home" && <>
          <p className={styles.kicker}>ENGLISH LANGUAGE · WRITING</p>
          <h1>Informal letters, one step at a time.</h1>
          <p className={styles.lead}>Memorise the exact school format. Then read, choose, arrange, and review six different letters. There are no long text boxes.</p>
          <div className={styles.heroGrid}>
            <div className={styles.heroCard}><span>01</span><h3>Fixed format</h3><p>One address, exact line endings, empty lines, and a left-aligned closing.</p></div>
            <div className={styles.heroCard}><span>02</span><h3>Four jobs</h3><p>Connect → Tell → Deepen → Close. The jobs stay the same as the topic changes.</p></div>
            <div className={styles.heroCard}><span>03</span><h3>Case studies</h3><p>Tap through a full letter at a time, then try an unfamiliar prompt.</p></div>
          </div>
          <div className={styles.actions}><button type="button" onClick={() => navigate("format-learn")}>Start the experience →</button><button type="button" className={styles.secondary} onClick={() => navigate("cases")}>Explore case studies</button></div>
          <p className={styles.note}>Completed cases and notebook checks are remembered on this browser. The final letter is written by hand.</p>
        </>}

        {screen === "format-learn" && <>
          <p className={styles.kicker}>PART 1 · THE SCHOOL FORMAT</p>
          <h1>Learn this exact frame.</h1>
          <p className={styles.lead}>Memorise this example with the fixed address and name Riya. In a real exam, change the date and greeting to fit the question while keeping the same layout.</p>
          <div className={styles.twoColumns}>
            <FormatSheet />
            <div className={styles.lessonNotes}>
              <h2>Look closely</h2>
              <ul>
                <li><strong>26, Sunny Apartments,</strong> is the first address line.</li>
                <li><strong>Bangalore- 560018.</strong> has a full stop after the PIN code.</li>
                <li>Leave a full empty line after the PIN line, after the date, and after the conclusion.</li>
                <li>The date has a comma and ends with a full stop.</li>
                <li><strong>My dear Mother,</strong> uses the relative&apos;s capital letter and a comma.</li>
                <li>Start all three closing lines at the left margin: <strong>With love,</strong> then <strong>Yours affectionately,</strong> then the name.</li>
                <li><strong>affectionately</strong> is spelled in full. There is no full stop after Riya.</li>
              </ul>
              <p>No punctuation lesson here: this is the exact format to remember.</p>
            </div>
          </div>
          <div className={styles.actions}><button type="button" onClick={() => { setFormatIndex(0); setFormatChoice(null); setFormatChecked(false); setFormatCorrectCount(0); navigate("format-quiz"); }}>Practise the format →</button></div>
        </>}

        {screen === "format-quiz" && <>
          <p className={styles.kicker}>FORMAT RECALL · {formatIndex + 1} OF {FORMAT_QUESTIONS.length}</p>
          <div className={styles.progress}><span style={{ width: `${((formatIndex + 1) / FORMAT_QUESTIONS.length) * 100}%` }} /></div>
          <h1>{formatQuestion.prompt}</h1>
          <p className={styles.lead}>Tap one answer. Check it, then move on.</p>
          <ChoiceOptions question={formatQuestion} selected={formatChoice} onSelect={setFormatChoice} checked={formatChecked} />
          {formatChecked && <div className={`${styles.feedback} ${formatRight ? styles.feedbackGood : styles.feedbackTry}`} role="status"><strong>{formatRight ? "Exactly right" : "Notice the difference"}</strong>{!formatRight && <p><strong>Correct answer:</strong> {formatQuestion.options[formatQuestion.correct]}</p>}<p>{formatQuestion.explanation}</p></div>}
          <div className={styles.actions}>{formatChecked ? <button type="button" onClick={nextFormatQuestion}>{formatIndex === FORMAT_QUESTIONS.length - 1 ? "Rebuild the whole format →" : "Next detail →"}</button> : <button type="button" disabled={formatChoice === null} onClick={checkFormat}>Check answer</button>}</div>
        </>}

        {screen === "format-rebuild" && <>
          <p className={styles.kicker}>FORMAT RECALL · FINAL STEP</p>
          <h1>Rebuild the letter frame.</h1>
          <p className={styles.lead}>Tap the lines in the order they belong on the page. The letter paragraphs sit between the greeting and closing.</p>
          <div className={styles.twoColumns}>
            <div className={styles.rebuildBox}>
              <h2>Your page</h2>
              {rebuildOrder.length ? <ol>{rebuildOrder.map((index) => <li key={index} className={[3, 4, 6].includes(index) ? styles.rebuildGap : ""}>{formatLines[index]}</li>)}</ol> : <p>Tap the first line below to begin.</p>}
              <button type="button" className={styles.textButton} disabled={!rebuildOrder.length} onClick={() => { setRebuildOrder((order) => order.slice(0, -1)); setRebuildChecked(false); }}>Undo last line</button>
            </div>
            <div className={styles.lineBank}>
              <h2>Line cards</h2>
              {shuffledLines.filter((index) => !rebuildOrder.includes(index)).map((index) => <button type="button" key={index} onClick={() => { setRebuildOrder((order) => [...order, index]); setRebuildChecked(false); }}>{formatLines[index]}</button>)}
            </div>
          </div>
          {rebuildChecked && <div className={`${styles.feedback} ${rebuiltCorrectly ? styles.feedbackGood : styles.feedbackTry}`} role="status"><strong>{rebuiltCorrectly ? "The frame is in order" : "Check the order again"}</strong><p>{rebuiltCorrectly ? `You also recognised ${formatCorrectCount} of ${FORMAT_QUESTIONS.length} small details on the first try.` : "The address comes first, then the date, greeting, paragraphs, and left-aligned closing. Undo or start again."}</p></div>}
          <div className={styles.actions}><button type="button" disabled={rebuildOrder.length !== formatLines.length} onClick={() => setRebuildChecked(true)}>Check the order</button><button type="button" className={styles.secondary} onClick={() => { setRebuildOrder([]); setRebuildChecked(false); }}>Start over</button>{rebuiltCorrectly && rebuildChecked && <button type="button" onClick={() => navigate("formula")}>Learn the formula →</button>}</div>
        </>}

        {screen === "formula" && <>
          <p className={styles.kicker}>PART 2 · ONE FORMULA FOR EVERY LETTER</p>
          <h1>Connect → Tell → Deepen → Close.</h1>
          <p className={styles.lead}>These are paragraph jobs, not a required number of sentences. The question tells you what content belongs in each job.</p>
          <div className={styles.formulaGrid}>
            <article><span>1 · INTRODUCTION</span><h2>Connect</h2><p>Greet the person warmly. Then make your reason for writing clear.</p></article>
            <article><span>2 · BODY 1</span><h2>Tell</h2><p>Give the main message the reader should hear first, with useful details.</p></article>
            <article><span>3 · BODY 2</span><h2>Deepen</h2><p>Answer the remaining part of the question. Add an example and why it matters.</p></article>
            <article><span>4 · CONCLUSION</span><h2>Close</h2><p>Return to the recipient with a personal thought and natural next step.</p></article>
          </div>
          <p className={styles.swipeHint}>Swipe across to see all four steps →</p>
          <div className={styles.callout}><strong>A safe opening line:</strong> “I hope you are doing well. I am fine here.” Then add a sentence saying why you are writing. Adjust the warm line when the person is upset. First read the question for its recipient and every requested point.</div>
          <div className={styles.actions}><button type="button" onClick={() => navigate("cases")}>Choose a case study →</button></div>
        </>}

        {screen === "cases" && <>
          <p className={styles.kicker}>PART 3 · CASE STUDIES</p>
          <h1>One full letter at a time.</h1>
          <p className={styles.lead}>Each case follows the same path: read the prompt, choose opening ideas, build the two body paragraphs, choose a close, and review the full letter. The final case is a new-prompt challenge.</p>
          <div className={styles.caseGrid}>
            {LETTER_CASES.map((item, index) => <button key={item.id} type="button" className={styles.caseTile} onClick={() => startCase(index)}>
              <span>{index === LETTER_CASES.length - 1 ? "CHALLENGE" : `CASE ${index + 1}`} · {item.family}</span>
              <strong>{item.title}</strong>
              <small>{finishedCases.includes(item.id) ? "Completed · Open again" : "Open case →"}</small>
            </button>)}
          </div>
        </>}

        {screen === "case" && <>
          <div className={styles.caseTopline}><p className={styles.kicker}>{caseIndex === LETTER_CASES.length - 1 ? "NEW PROMPT CHALLENGE" : `CASE ${caseIndex + 1} OF ${LETTER_CASES.length - 1}`} · {letterCase.family}</p><button type="button" className={styles.textButton} onClick={() => navigate("cases")}>All cases</button></div>
          <h1>{letterCase.title}</h1>
          {(caseStage !== 0 || !promptRead) && <div className={styles.promptBox}><span>EXAM-STYLE PROMPT</span><p>{letterCase.prompt}</p></div>}
          <div className={styles.stageRail} aria-label="Steps in this case">{caseStages.map((name, index) => <button type="button" key={name} className={index === caseStage ? styles.currentStage : ""} onClick={() => { setCaseStage(index); setCaseChoice(null); setSelectedCards([]); setCaseChecked(false); }} aria-current={index === caseStage ? "step" : undefined}><span className={styles.stageNumber}>{index + 1}</span><span>{name}</span></button>)}</div>

          {caseStage === 0 && !promptRead && <div className={styles.activity}>
            <p className={styles.activityLabel}>READ THE QUESTION FIRST</p>
            <h2>Read the whole prompt before you answer.</h2>
            <p className={styles.lead}>Find the recipient, the reason for writing, and every detail the question asks you to include. The prompt will hide when you are ready.</p>
            <button type="button" onClick={() => setPromptRead(true)}>I have read it → Hide the prompt</button>
          </div>}

          {caseStage === 0 && promptRead && <div className={styles.activity}>
            <p className={styles.activityLabel}>READ THE QUESTION</p>
            <h2>What does this particular letter need?</h2>
            <button type="button" className={styles.textButton} onClick={() => setPromptRead(false)}>Reread the prompt</button>
            <div className={styles.decodeGrid}>{letterCase.decode.map((question, questionIndex) => <div key={question.prompt} className={styles.decodeQuestion}>
              <h3>{question.prompt}</h3>
              <ChoiceOptions question={question} selected={decodeAnswers[questionIndex]} checked={caseChecked} onSelect={(value) => setDecodeAnswers((answers) => answers.map((answer, index) => index === questionIndex ? value : answer))} />
              {caseChecked && <p className={styles.smallFeedback}>{question.explanation}</p>}
            </div>)}</div>
          </div>}

          {[1, 3, 4, 5].includes(caseStage) && <div className={styles.activity}>
            <p className={styles.activityLabel}>{caseStages[caseStage].toUpperCase()}</p>
            {caseStage === 5 && <blockquote className={styles.excerpt}>{letterCase.review.excerpt}</blockquote>}
            <h2>{stageQuestion.prompt}</h2>
            <ChoiceOptions question={stageQuestion} selected={caseChoice} onSelect={setCaseChoice} checked={caseChecked} />
          </div>}

          {caseStage === 2 && <div className={styles.activity}>
            <p className={styles.activityLabel}>TELL · BODY 1</p>
            <h2>{letterCase.body1.prompt}</h2>
            <div className={styles.options} role="group" aria-label={letterCase.body1.prompt}>{letterCase.body1.cards.map((card) => <button type="button" key={card.id} disabled={caseChecked} aria-pressed={selectedCards.includes(card.id)} className={`${styles.option} ${selectedCards.includes(card.id) ? styles.selected : ""} ${caseChecked && card.correct ? styles.correct : ""} ${caseChecked && selectedCards.includes(card.id) && !card.correct ? styles.incorrect : ""}`} onClick={() => setSelectedCards((cards) => cards.includes(card.id) ? cards.filter((id) => id !== card.id) : [...cards, card.id])}><span className={styles.checkbox}>{selectedCards.includes(card.id) ? "✓" : ""}</span><span>{card.text}</span></button>)}</div>
            <p className={styles.hint}>Choose two cards.</p>
          </div>}

          {caseStage === 6 && <div className={styles.activity}>
            <p className={styles.activityLabel}>READ THE WHOLE LETTER</p>
            <h2>See how the four jobs make one letter.</h2>
            <div className={styles.modelLayout}>
              <FormatSheet letterCase={letterCase} />
              <div className={styles.modelGuide}><h3>Follow the paragraphs</h3><p><strong>Connect:</strong> the first paragraph begins warmly, then gives the purpose.</p><p><strong>Tell:</strong> the next paragraph makes the main message clear.</p><p><strong>Deepen:</strong> the following paragraph supplies the remaining detail and personal meaning.</p><p><strong>Close:</strong> the last paragraph returns to the recipient.</p><p>The address and closing use the school format throughout.</p></div>
            </div>
          </div>}

          {caseChecked && caseStage < 6 && <div className={`${styles.feedback} ${caseRight ? styles.feedbackGood : styles.feedbackTry}`} role="status"><strong>{caseRight ? "Good choice" : "Look at what this letter needs"}</strong><p>{caseStage === 0 ? "The question must be read for its recipient, purpose, and every required point. Review the notes under each answer." : caseStage === 2 ? letterCase.body1.explanation : stageQuestion.explanation}</p></div>}
          {(caseStage !== 0 || promptRead) && <div className={styles.actions}>{caseStage === 6 ? <button type="button" onClick={nextCaseStage}>{caseIndex === LETTER_CASES.length - 1 ? "Go to the paper task →" : "Next case study →"}</button> : caseChecked ? <button type="button" onClick={nextCaseStage}>{caseStage === 5 ? "Read the whole letter →" : "Next step →"}</button> : <button type="button" disabled={caseStage === 0 ? !decodeComplete : caseStage === 2 ? selectedCards.length === 0 : caseChoice === null} onClick={checkCase}>Check my choice</button>}</div>}
        </>}

        {screen === "paper" && <>
          <p className={styles.kicker}>PART 4 · OFF-SCREEN TRANSFER</p>
          <h1>Now write one by hand.</h1>
          <p className={styles.lead}>The click exercises teach what to notice. This final task checks whether you can make your own letter, as you will in the exam.</p>
          <div className={styles.promptBox}><span>NEW WRITING PROMPT</span><p>Write a letter to your cousin saying that you will visit during the summer holidays. Tell your cousin when you plan to come, what you would like to do together, and why you are looking forward to the visit.</p></div>
          <div className={styles.twoColumns}>
            <div className={styles.paperPanel}><h2>Keep this beside your notebook</h2><ol><li><strong>Connect:</strong> Begin with a warm enquiry. Why are you writing to your cousin?</li><li><strong>Tell:</strong> When will you visit, and what is the main plan?</li><li><strong>Deepen:</strong> What will you do together, and why does the visit matter?</li><li><strong>Close:</strong> What should your cousin say or do next?</li></ol><p>Use the exact school format at the top and bottom. Write the middle in your own words.</p></div>
            <FormatSheet greeting="My dear Cousin," />
          </div>
          <div className={styles.paperPanel}><h2>After writing, check your letter</h2><div className={styles.checks}>{PAPER_CHECKS.map((item, index) => <label key={item}><input type="checkbox" checked={paperChecks[index]} onChange={() => setPaperChecks((checks) => checks.map((checked, position) => position === index ? !checked : checked))} /><span>{item}</span></label>)}</div></div>
          <div className={styles.actions}><button type="button" onClick={() => navigate("done")}>Finish the lesson →</button><button type="button" className={styles.secondary} onClick={() => window.print()}>Print this task</button></div>
        </>}

        {screen === "done" && <>
          <p className={styles.kicker}>LESSON COMPLETE</p>
          <h1>The formula is ready to use.</h1>
          <p className={styles.lead}>Connect → Tell → Deepen → Close. Use the exact school format, read every part of the question, and let the main letter carry your own ideas.</p>
          <div className={styles.callout}><strong>Your work:</strong> {finishedCases.length} of {LETTER_CASES.length} case studies opened through their complete letter; {paperChecks.filter(Boolean).length} of {PAPER_CHECKS.length} notebook checks ticked.</div>
          <div className={styles.actions}><button type="button" onClick={reset}>Start again</button><button type="button" className={styles.secondary} onClick={() => navigate("cases")}>Revisit a case</button><Link href="/study">Back to subjects</Link></div>
        </>}
      </section>
    </div>
  </main>;
}
