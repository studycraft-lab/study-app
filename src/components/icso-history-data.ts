import type { FoundationLesson } from "./icso-foundations-data";

export const historyLesson: FoundationLesson = {
  title: "Computer History Time Lab",
  subtitle: "Build the technology timeline and match people and machines to their contributions.",
  theme: "history",
  sourceNote: "Original practice based on the saved Grade 6 ICSO synopsis and recent papers. Generation dates are approximate classroom groupings.",
  missions: [
    {
      title: "Build the early timeline", minutes: 3, demo: "timeline",
      idea: "The school generation map starts with vacuum tubes, then transistors, then integrated circuits (ICs).",
      bins: ["1st generation", "2nd generation", "3rd generation"],
      cases: [
        { item: "Vacuum tubes", prompt: "Which generation is most associated with these bulky electronic switches?", answer: 0, explanation: "First-generation electronic computers are commonly associated with vacuum tubes." },
        { item: "Transistors", prompt: "Which generation replaced many tubes with smaller semiconductor switches?", answer: 1, explanation: "Second-generation machines are commonly associated with transistors." },
        { item: "Integrated circuits", prompt: "Which generation groups many components on a chip?", answer: 2, explanation: "Third-generation computers are commonly associated with ICs." },
      ],
      check: { prompt: "In the common school timeline, which technology follows transistors?", options: ["Vacuum tubes", "Integrated circuits", "Punched cards only", "Typewriters"], answer: 1, explanation: "The usual sequence is tubes, transistors, then integrated circuits." },
    },
    {
      title: "Meet the later labels", minutes: 4,
      idea: "The fourth-generation label highlights microprocessors and personal computers. Many school charts associate the fifth with AI; AI is a field, not a single replacement for chips.",
      bins: ["3rd · ICs", "4th · microprocessors", "5th · AI focus"],
      cases: [
        { item: "System/360-era machine", prompt: "Which classroom generation label fits this 1960s family?", answer: 0, explanation: "IBM System/360 is taught with the third-generation era. Its first models used IBM's Solid Logic Technology rather than a simple one-chip IC." },
        { item: "One-chip CPU", prompt: "Which label highlights the microprocessor?", answer: 1, explanation: "Microprocessors are the familiar fourth-generation school label." },
        { item: "Language-capable AI", prompt: "Which label do school charts associate with AI research?", answer: 2, explanation: "School charts often call this fifth generation. Current AI still runs on hardware descended from earlier technologies." },
      ],
      check: { prompt: "Which statement about the fifth-generation label is most accurate?", options: ["AI instantly replaced all microprocessors", "School charts link it with AI, while real technologies overlap", "It uses only vacuum tubes", "It means every computer is a robot"], answer: 1, explanation: "The generation labels are a teaching scheme; technologies overlap in practice." },
    },
    {
      title: "Match the machines", minutes: 4,
      idea: "A named machine can help you remember the technology era, but a model name is not itself a generation.",
      bins: ["ENIAC · tubes", "IBM 1401 · transistors", "System/360 · IC era"],
      cases: [
        { item: "Large 1940s machine", prompt: "Which named example used thousands of vacuum tubes?", answer: 0, explanation: "ENIAC was an early electronic computer built with vacuum tubes." },
        { item: "1959 business computer", prompt: "Which named example used transistors?", answer: 1, explanation: "The IBM 1401 was a transistor-based business computer." },
        { item: "1964 IBM family", prompt: "Which named family is associated with the third-generation era?", answer: 2, explanation: "IBM System/360 was introduced in 1964 and is commonly taught with the third-generation era." },
      ],
      check: { prompt: "Which pair is correctly matched?", options: ["ENIAC — microprocessor PC", "IBM 1401 — transistor era", "System/360 — vacuum-tube era", "All three — AI era"], answer: 1, explanation: "The IBM 1401 used transistors." },
    },
    {
      title: "Meet three contributors", minutes: 4,
      idea: "Remember the contribution rather than a disputed 'first ever' title.",
      bins: ["Charles Babbage", "Ada Lovelace", "Tim Berners-Lee"],
      cases: [
        { item: "Analytical Engine", prompt: "Who designed this proposed general-purpose mechanical computer?", answer: 0, explanation: "Charles Babbage designed the Analytical Engine." },
        { item: "Engine notes", prompt: "Who wrote influential notes, including a method for Bernoulli numbers?", answer: 1, explanation: "Ada Lovelace wrote influential notes about Babbage's machine." },
        { item: "World Wide Web", prompt: "Who proposed and developed the Web at CERN?", answer: 2, explanation: "Tim Berners-Lee invented the World Wide Web while at CERN." },
      ],
      check: { prompt: "Which person is correctly linked to the Web?", options: ["Charles Babbage", "Ada Lovelace", "Tim Berners-Lee", "John von Neumann"], answer: 2, explanation: "Tim Berners-Lee developed the World Wide Web at CERN." },
    },
    {
      title: "Choose the computer type", minutes: 4,
      idea: "A personal computer serves one person; mainframes serve many large business workloads; supercomputers tackle very demanding calculations.",
      bins: ["Microcomputer", "Mainframe", "Supercomputer"],
      cases: [
        { item: "Home laptop", prompt: "Which traditional category covers a personal laptop?", answer: 0, explanation: "A laptop is a personal or microcomputer." },
        { item: "Bank transactions", prompt: "Which category is often used for very large transaction workloads?", answer: 1, explanation: "Mainframes are built for reliable high-volume enterprise processing." },
        { item: "Weather simulation", prompt: "Which category is suited to huge scientific calculations?", answer: 2, explanation: "Supercomputers are built for demanding scientific computation." },
      ],
      check: { prompt: "Which task most strongly points to a supercomputer?", options: ["Writing one school essay", "Running a large climate simulation", "Printing one page", "Choosing a wallpaper"], answer: 1, explanation: "Large climate models require enormous computing power." },
    },
    {
      title: "Where does a mini fit?", minutes: 4,
      idea: "'Minicomputer' is a historical size and market label, between early personal computers and large mainframes; today's categories can overlap.",
      bins: ["Microcomputer", "Minicomputer", "Mainframe"],
      cases: [
        { item: "Single-user laptop", prompt: "Which traditional category fits best?", answer: 0, explanation: "A personal laptop is a microcomputer." },
        { item: "DEC PDP-11", prompt: "Which historical category was this multi-user system sold in?", answer: 1, explanation: "The PDP-11 is a classic minicomputer example." },
        { item: "IBM Z banking system", prompt: "Which enterprise category fits best?", answer: 2, explanation: "IBM Z is a mainframe family." },
      ],
      check: { prompt: "Why is 'minicomputer' treated as a historical label here?", options: ["It means a tiny modern phone", "Computer categories and size boundaries change over time", "It is another name for a mouse", "It always uses vacuum tubes"], answer: 1, explanation: "The old size/market categories are useful for the exam but do not define every modern system." },
    },
  ],
  challenge: [
    { prompt: "Arrange the first three generation technologies in the usual classroom order.", options: ["ICs → tubes → transistors", "Tubes → transistors → ICs", "Transistors → ICs → tubes", "Tubes → microprocessors → transistors"], answer: 1, explanation: "The common sequence is vacuum tubes, transistors, then ICs." },
    { prompt: "Which development is most associated with the fourth-generation school label?", options: ["Microprocessors", "Vacuum tubes", "Only mechanical gears", "Only optical discs"], answer: 0, explanation: "Microprocessors are the core fourth-generation label." },
    { prompt: "Choose the correct pair: 1. IBM 1401 used transistors. 2. ENIAC used vacuum tubes.", options: ["Only 1", "Only 2", "Both 1 and 2", "Neither"], answer: 2, explanation: "Both matches are correct." },
    { prompt: "Who is matched to the correct contribution?", options: ["Ada Lovelace — invented the Web", "Babbage — designed the Analytical Engine", "Berners-Lee — built ENIAC", "Babbage — invented the microprocessor"], answer: 1, explanation: "Charles Babbage designed the Analytical Engine." },
    { prompt: "A 1970s PDP-11 is usually classed as a…", options: ["minicomputer", "personal smartphone", "supercomputer", "web browser"], answer: 0, explanation: "The PDP-11 is a classic minicomputer example." },
    { prompt: "Which statement is the safest reading of the 'fifth generation' label?", options: ["AI is a school focus, while technologies still overlap", "Every computer stopped using microprocessors", "Every computer is a quantum machine", "It came before vacuum tubes"], answer: 0, explanation: "The labels are a teaching model; AI does not replace all earlier hardware." },
  ],
};
